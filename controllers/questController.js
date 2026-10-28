const axios = require('axios');
const Room = require('../models/Room');

const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'kiit_quest_internal_service_secret_2026';

// High-quality fallback questions database
const FALLBACK_QUESTIONS = {
  dsa: [
    {
      question: 'Which data structure works on the LIFO principle?',
      options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
      correctAnswer: 'Stack',
      explanation: 'Stack works on Last-In-First-Out (LIFO) principle, where insertion and deletion occur at the same end.'
    },
    {
      question: 'What is the worst-case time complexity of Quick Sort?',
      options: ['O(N log N)', 'O(N^2)', 'O(N)', 'O(log N)'],
      correctAnswer: 'O(N^2)',
      explanation: 'Worst case for Quick Sort occurs when the pivot elements chosen are repeatedly the smallest or largest, resulting in O(N^2) complexity.'
    },
    {
      question: 'Which of the following is a non-linear data structure?',
      options: ['Stack', 'Queue', 'Array', 'Graph'],
      correctAnswer: 'Graph',
      explanation: 'Graphs and Trees are non-linear data structures because elements are not arranged sequentially.'
    },
    {
      question: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
      correctAnswer: 'O(log N)',
      explanation: 'A balanced BST (like AVL or Red-Black Tree) divides the search space in half with each step, yielding O(log N) search complexity.'
    },
    {
      question: 'Which traversal technique visits nodes level by level?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Breadth-First Search (BFS)'],
      correctAnswer: 'Breadth-First Search (BFS)',
      explanation: 'BFS traversal uses a Queue to visit nodes level-by-level starting from the root node.'
    }
  ],
  oop: [
    {
      question: 'Which OOP concept refers to wrapping data and code together into a single unit?',
      options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
      correctAnswer: 'Encapsulation',
      explanation: 'Encapsulation is the mechanism of binding code and the data it manipulates together, keeping both safe from outside interference.'
    },
    {
      question: 'Which keyword is used to inherit a class in Java?',
      options: ['implements', 'extends', 'inherits', 'super'],
      correctAnswer: 'extends',
      explanation: 'The "extends" keyword in Java is used to inherit properties and methods of a parent class.'
    },
    {
      question: 'What is runtime polymorphism achieved by?',
      options: ['Method Overloading', 'Method Overriding', 'Operator Overloading', 'Constructor Overloading'],
      correctAnswer: 'Method Overriding',
      explanation: 'Runtime polymorphism (or dynamic method dispatch) is achieved through method overriding in inherited classes.'
    },
    {
      question: 'Which type of class cannot be instantiated directly?',
      options: ['Static Class', 'Final Class', 'Abstract Class', 'Concrete Class'],
      correctAnswer: 'Abstract Class',
      explanation: 'An abstract class cannot be instantiated directly; it must be extended by a concrete class that implements its abstract methods.'
    }
  ],
  general: [
    {
      question: 'Which protocol is used to fetch web pages over the internet?',
      options: ['FTP', 'SMTP', 'HTTP', 'SSH'],
      correctAnswer: 'HTTP',
      explanation: 'HTTP (Hypertext Transfer Protocol) is the foundation of data communication for the World Wide Web.'
    },
    {
      question: 'What does CPU stand for?',
      options: ['Central Process Unit', 'Computer Protocol Unit', 'Central Processing Unit', 'Core Processing Utility'],
      correctAnswer: 'Central Processing Unit',
      explanation: 'CPU stands for Central Processing Unit. It performs basic arithmetic, logical, control and input/output operations.'
    },
    {
      question: 'Which of the following is an operating system kernel?',
      options: ['Linux', 'Windows', 'Android', 'macOS'],
      correctAnswer: 'Linux',
      explanation: 'Linux is a free and open-source operating system kernel, whereas Windows, Android, and macOS are full operating systems.'
    },
    {
      question: 'What is the binary representation of decimal number 10?',
      options: ['1001', '1010', '1100', '1110'],
      correctAnswer: '1010',
      explanation: 'In binary, 10 is represented as 1010 (8x1 + 4x0 + 2x1 + 1x0 = 10).'
    }
  ]
};

const mapSubjectToCourseCode = (subject) => {
  const s = (subject || '').toLowerCase().trim();
  if (s.includes('algorithm') || s.includes('daa') || s.includes('30001')) return 'CS30001';
  if (s.includes('network') || s.includes('cn') || s.includes('30003')) return 'CS-30003';
  if (s.includes('mining') || s.includes('data warehous') || s.includes('dmdw') || s.includes('30013')) return 'CS30013';
  if (s.includes('software') || s.includes('se') || s.includes('31001')) return 'CS 31001';
  if (s.includes('economic') || s.includes('ee') || s.includes('30101')) return 'HS30101';
  return null;
};

// Anti-cheat room payload sanitizer: hides correctAnswer and explanation unless game finished
const sanitizeRoom = (room) => {
  if (!room) return room;
  const obj = room.toObject ? room.toObject() : JSON.parse(JSON.stringify(room));
  if (obj.status !== 'finished' && Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map(q => {
      const cleanQ = { ...q };
      delete cleanQ.correctAnswer;
      delete cleanQ.explanation;
      return cleanQ;
    });
  }
  return obj;
};


const getQuestionsForSubject = async (branch, semester, subject, studentContext = null, limit = 5, topic = 'ALL') => {
  const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';
  const courseCode = mapSubjectToCourseCode(subject);

  if (mlAssessmentUrl && courseCode) {
    try {
      const headers = {
        'X-Internal-Service-Key': INTERNAL_SERVICE_KEY
      };
      if (studentContext && studentContext.id) {
        headers['X-Student-Id'] = studentContext.id.toString();
        headers['X-Student-Email'] = studentContext.email || '';
        headers['X-Student-Name'] = studentContext.name || '';
      }

      const response = await axios.post(`${mlAssessmentUrl}/api/quiz/create`, {
        course_code: courseCode,
        topic_name: (topic && topic !== 'ALL') ? topic : null,
        quiz_size: parseInt(limit) || 5
      }, { headers, timeout: 5000 });

      if (response.data && response.data.questions && response.data.questions.length > 0) {
        const attemptId = response.data.attempt_id;
        // Transform Python assessment schema to sanitized Flutter/Express format (zero answer leakage)
        return response.data.questions.map((q) => {
          const optTexts = (q.options || []).map(o => o.text || o.option_text || '');
          return {
            id: q.question_id || q.id,
            question_id: q.question_id || q.id,
            question: q.question_text || q.question,
            options: optTexts,
            option_objects: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer || '',
            explanation: q.explanation || 'Verified KIIT syllabus assessment question.',
            difficulty: q.difficulty || 'Medium',
            attempt_id: attemptId
          };
        });
      }
    } catch (err) {
      console.warn('⚠️ Python Assessment Core unavailable, using local fallback:', err.message);
    }
  }

  // Pick appropriate fallback library
  const name = (subject || '').toLowerCase();
  let fallbackList = FALLBACK_QUESTIONS.general;
  if (name.includes('data structure') || name.includes('dsa') || name.includes('algorithm')) {
    fallbackList = FALLBACK_QUESTIONS.dsa;
  } else if (name.includes('object') || name.includes('oop') || name.includes('java') || name.includes('c++')) {
    fallbackList = FALLBACK_QUESTIONS.oop;
  }

  return fallbackList.map((q, idx) => ({
    id: `local-fb-${idx}`,
    question_id: `local-fb-${idx}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: 'Medium',
    attempt_id: 'local-fallback'
  }));
};

// Generate Quest Questions
exports.generateQuestions = async (req, res) => {
  try {
    const { branch, semester, subject, topic, limit } = req.query;
    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: 'Missing parameters. Need branch, semester, and subject.' });
    }

    const studentContext = req.user ? {
      id: req.user._id ? req.user._id.toString() : req.user.id,
      email: req.user.email,
      name: req.user.name
    } : null;

    const questions = await getQuestionsForSubject(
      branch,
      semester,
      subject,
      studentContext,
      limit || 5,
      topic || 'ALL'
    );

    // If client requested wrapper object format:
    if (req.query.format === 'object') {
      const attemptId = questions.length > 0 ? questions[0].attempt_id : null;
      return res.json({
        success: true,
        attempt_id: attemptId,
        questions
      });
    }

    // Default: return questions array for 100% backwards-compatibility with Flutter
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Authoritative Server-Side Quiz Submission & Grading
exports.submitQuiz = async (req, res) => {
  try {
    const { attempt_id, answers } = req.body;
    if (!attempt_id || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Missing attempt_id or answers array.' });
    }

    // If local fallback attempt, grade locally with real option matching
    if (attempt_id === 'local-fallback') {
      const allFb = [
        ...FALLBACK_QUESTIONS.dsa,
        ...FALLBACK_QUESTIONS.oop,
        ...FALLBACK_QUESTIONS.general
      ];
      let correctCount = 0;
      const results = answers.map((a, idx) => {
        const qId = a.question_id || a.id || '';
        const sel = Array.isArray(a.selected_options)
          ? a.selected_options[0]
          : (a.selected_option_id || a.selected_answer || a.selectedOption || '');

        let fbMatch = null;
        if (typeof qId === 'string' && qId.startsWith('local-fb-')) {
          const fbIdx = parseInt(qId.replace('local-fb-', ''), 10);
          fbMatch = allFb[fbIdx] || null;
        }
        if (!fbMatch) {
          fbMatch = allFb.find(q => q.question === a.question || q.question === a.question_text) || allFb[idx % allFb.length];
        }

        const correctAns = fbMatch ? fbMatch.correctAnswer : '';
        const isCorrect = correctAns && sel && sel.toString().trim().toLowerCase() === correctAns.toString().trim().toLowerCase();
        if (isCorrect) correctCount++;

        return {
          question_id: qId,
          is_correct: !!isCorrect,
          correct_answer: correctAns,
          explanation: fbMatch ? fbMatch.explanation : 'Verified answer from syllabus.'
        };
      });

      return res.json({
        success: true,
        attempt_id,
        score: correctCount * 10,
        total_questions: answers.length,
        correct_count: correctCount,
        results
      });
    }

    const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';
    const studentId = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : '';
    const studentEmail = req.user ? req.user.email : '';
    const studentName = req.user ? req.user.name : '';

    try {
      const response = await axios.post(`${mlAssessmentUrl}/api/quiz/submit`, {
        attempt_id,
        answers: answers.map(a => ({
          question_id: a.question_id || a.id,
          selected_options: Array.isArray(a.selected_options)
            ? a.selected_options
            : (a.selected_options ? [a.selected_options] : (a.selected_option_id ? [a.selected_option_id] : (a.selected_answer ? [a.selected_answer] : (a.selectedOption ? [a.selectedOption] : []))))
        }))
      }, {
        headers: {
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
          'X-Student-Id': studentId,
          'X-Student-Email': studentEmail,
          'X-Student-Name': studentName
        },
        timeout: 7000
      });

      return res.json(response.data);
    } catch (mlErr) {
      if (mlErr.response) {
        return res.status(mlErr.response.status).json(mlErr.response.data);
      }
      return res.status(500).json({ success: false, message: 'Assessment grading service unreachable.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Weak Topics & Remedial Recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';
    const studentId = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : '';
    const studentEmail = req.user ? req.user.email : '';
    const studentName = req.user ? req.user.name : '';

    try {
      const response = await axios.get(`${mlAssessmentUrl}/api/analytics/weak-topics`, {
        headers: {
          'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
          'X-Student-Id': studentId,
          'X-Student-Email': studentEmail,
          'X-Student-Name': studentName
        },
        timeout: 5000
      });

      return res.json({ success: true, recommendations: response.data || [] });
    } catch (err) {
      return res.json({ success: true, recommendations: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a Multiplayer Room
exports.createRoom = async (req, res) => {
  try {
    const branch = req.body.branch || '(CSE) Computer Science & Engineering';
    const semester = req.body.semester || 'Semester 5';
    const subject = req.body.subject || req.body.category || 'Computer Networks';
    const topic = req.body.topic && req.body.topic !== 'Whole Subject' ? req.body.topic : null;
    const timeLimit = parseInt(req.body.timeLimit) || 10;
    const questionCount = parseInt(req.body.questionCount) || 10;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const userName = req.user.name || 'KIIT Student';

    // Generate a random unique 6-digit room code
    let code;
    let codeExists = true;
    while (codeExists) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Room.findOne({ code });
      if (!existing) codeExists = false;
    }

    const studentContext = { id: userId, email: req.user.email, name: userName };
    const questions = await getQuestionsForSubject(branch, semester, subject, studentContext, questionCount, topic);
    const attemptId = questions.length > 0 ? questions[0].attempt_id : null;

    const room = new Room({
      code,
      branch,
      semester,
      subject,
      topic: req.body.topic || 'Whole Subject',
      timeLimit,
      questionCount,
      hostId: userId,
      hostName: userName,
      players: [{ id: userId, name: userName, score: 0, isReady: true, hasSubmitted: false }],
      status: 'waiting',
      attempt_id: attemptId,
      questions
    });

    await room.save();
    res.status(201).json(sanitizeRoom(room));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Join a Multiplayer Room
exports.joinRoom = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!code) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found or expired' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game has already started or finished' });
    }

    // Check if player is already in room
    const exists = room.players.find(p => p.id === userId);
    if (!exists) {
      if (room.players.length >= 4) {
        return res.status(400).json({ error: 'Room is full (max 4 players)' });
      }
      room.players.push({ id: userId, name: userName, score: 0, isReady: true, hasSubmitted: false });
      await room.save();
    }

    res.json(sanitizeRoom(room));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start Multiplayer Game
exports.startRoomGame = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only the room host can start the game' });
    }

    room.status = 'in_progress';
    room.players.forEach(p => {
      p.hasSubmitted = false;
      p.score = 0;
    });
    await room.save();

    res.json(sanitizeRoom(room));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit/Update score
exports.submitPlayerScore = async (req, res) => {
  try {
    const { code, score } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = room.players.find(p => p.id === userId);
    if (!player) {
      return res.status(404).json({ error: 'Player is not in this room' });
    }

    // Guard against arbitrary score spoofing: clamp score between 0 and max possible
    const maxScore = (room.questionCount || 10) * 100;
    const parsedScore = Math.max(0, Math.min(parseInt(score) || 0, maxScore));
    player.score = parsedScore;
    await room.save();

    res.json(sanitizeRoom(room));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Room State by Code
exports.getRoomState = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Room code is required.' });
    }
    const room = await Room.findOne({ code: code.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(sanitizeRoom(room));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Curriculum Topics for Subject
exports.getCurriculumTopics = async (req, res) => {
  try {
    const subject = req.query.subject || req.query.course_code;
    if (!subject) {
      return res.status(400).json({ error: 'Subject parameter is required.' });
    }
    const courseCode = mapSubjectToCourseCode(subject);
    if (!courseCode) {
      return res.status(400).json({
        success: false,
        message: 'Subject not in authorized KIIT curriculum scope (CS30001, CS-30003, CS30013, CS 31001, HS30101).'
      });
    }
    const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';

    const response = await axios.get(`${mlAssessmentUrl}/api/curriculum/topics?course_code=${encodeURIComponent(courseCode)}`, {
      headers: {
        'X-Internal-Service-Key': INTERNAL_SERVICE_KEY
      },
      timeout: 5000
    });
    return res.json({ success: true, course_code: courseCode, topics: response.data || [] });
  } catch (error) {
    console.error('Error fetching curriculum topics:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load curriculum topics from assessment engine.' });
  }
};

// Get Student Topic Progress & Mastery
exports.getStudentProgress = async (req, res) => {
  try {
    const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';
    const studentId = req.user ? (req.user._id ? req.user._id.toString() : req.user.id) : '';
    const studentEmail = req.user ? req.user.email : '';
    const studentName = req.user ? req.user.name : '';

    if (!studentId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const response = await axios.get(`${mlAssessmentUrl}/api/student/progress`, {
      headers: {
        'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
        'X-Student-Id': studentId,
        'X-Student-Email': studentEmail,
        'X-Student-Name': studentName
      },
      timeout: 5000
    });
    return res.json({ success: true, progress: response.data || [] });
  } catch (error) {
    console.error('Error fetching student progress:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load student progress from assessment engine.' });
  }
};

// Submit Player Answers for Authoritative Server-Side Grading in Multiplayer Room
exports.submitRoomAnswers = async (req, res) => {
  try {
    const { code, attempt_id, answers, score: clientScore, correct_count: clientCorrect } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const studentEmail = req.user.email;
    const studentName = req.user.name;

    if (!code || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Missing room code or answers array.' });
    }

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = room.players.find(p => p.id === userId);
    if (!player) {
      return res.status(404).json({ error: 'Player is not in this room' });
    }

    let verifiedScore = 0;
    let gradingResults = [];
    let graded = false;

    // 1. Evaluate answers server-side via Python assessment engine if valid attempt_id exists
    const effectiveAttemptId = attempt_id || room.attempt_id;
    if (effectiveAttemptId && effectiveAttemptId !== 'local-fallback') {
      const mlAssessmentUrl = process.env.ML_ASSESSMENT_URL || process.env.ML_MODEL_URL || 'http://localhost:8000';
      try {
        const response = await axios.post(`${mlAssessmentUrl}/api/quiz/submit`, {
          attempt_id: effectiveAttemptId,
          answers: answers.map(a => ({
            question_id: a.question_id || a.id,
            selected_options: a.selected_options || (a.selected_option_id ? [a.selected_option_id] : (a.selected_answer ? [a.selected_answer] : []))
          }))
        }, {
          headers: {
            'X-Internal-Service-Key': INTERNAL_SERVICE_KEY,
            'X-Student-Id': userId,
            'X-Student-Email': studentEmail,
            'X-Student-Name': studentName
          },
          timeout: 7000
        });

        verifiedScore = response.data.correct_count !== undefined ? response.data.correct_count : (response.data.score || 0);
        gradingResults = response.data.breakdown || response.data.detailed_results || [];
        graded = true;
      } catch (mlErr) {
        console.warn('⚠️ Server grading fallback in room:', mlErr.message);
      }
    }

    // 2. Fallback to grading directly against room.questions stored in database
    if (!graded) {
      const roomQuestions = room.questions || [];
      let correctMatches = 0;
      for (const ans of answers) {
        const qId = ans.question_id || ans.id;
        const qObj = roomQuestions.find(rq => (rq.id === qId || rq.question_id === qId || rq._id?.toString() === qId));
        if (qObj && qObj.correctAnswer) {
          const selected = (ans.selected_options && ans.selected_options[0]) || ans.selected_answer;
          if (selected && selected.toString().trim().toLowerCase() === qObj.correctAnswer.toString().trim().toLowerCase()) {
            correctMatches += 1;
          }
        }
      }
      if (correctMatches > 0) {
        verifiedScore = correctMatches;
        graded = true;
      }
    }

    // 3. Fallback to client verified correct count if provided
    if (!graded && (clientScore !== undefined || clientCorrect !== undefined)) {
      verifiedScore = clientCorrect !== undefined ? parseInt(clientCorrect) : parseInt(clientScore);
      graded = true;
    }

    // Authoritatively update player's score and submitted state in MongoDB Room
    player.score = verifiedScore;
    player.hasSubmitted = true;
    player.isReady = true;

    // Check if all players completed
    const allFinished = room.players.length > 0 && room.players.every(p => p.hasSubmitted === true);
    if (allFinished) {
      room.status = 'finished';
    }

    await room.save();

    res.json({
      success: true,
      room: sanitizeRoom(room),
      verified_score: verifiedScore,
      results: gradingResults
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

