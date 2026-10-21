const axios = require('axios');
const Room = require('../models/Room');

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

const getQuestionsForSubject = async (branch, semester, subject) => {
  const mlModelUrl = process.env.ML_MODEL_URL;
  if (mlModelUrl) {
    try {
      const response = await axios.post(mlModelUrl, { branch, semester, subject }, { timeout: 5000 });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('⚠️ ML Model Request Failed. Falling back to local questions database.');
    }
  }

  // Pick appropriate fallback library
  const name = (subject || '').toLowerCase();
  if (name.includes('data structure') || name.includes('dsa') || name.includes('algorithm')) {
    return FALLBACK_QUESTIONS.dsa;
  } else if (name.includes('object') || name.includes('oop') || name.includes('java') || name.includes('c++')) {
    return FALLBACK_QUESTIONS.oop;
  }
  return FALLBACK_QUESTIONS.general;
};

// Generate Quest Questions
exports.generateQuestions = async (req, res) => {
  try {
    const { branch, semester, subject } = req.query;
    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: 'Missing parameters. Need branch, semester, and subject.' });
    }

    const questions = await getQuestionsForSubject(branch, semester, subject);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a Multiplayer Room
exports.createRoom = async (req, res) => {
  try {
    const { branch, semester, subject } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: 'Missing branch, semester, or subject' });
    }

    // Generate a random unique 6-digit room code
    let code;
    let codeExists = true;
    while (codeExists) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Room.findOne({ code });
      if (!existing) codeExists = false;
    }

    const questions = await getQuestionsForSubject(branch, semester, subject);

    const room = new Room({
      code,
      branch,
      semester,
      subject,
      hostId: userId,
      hostName: userName,
      players: [{ id: userId, name: userName, score: 0, isReady: true }],
      status: 'waiting',
      questions
    });

    await room.save();
    res.status(201).json(room);
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
      room.players.push({ id: userId, name: userName, score: 0, isReady: true });
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Start Multiplayer Game
exports.startRoomGame = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only the room host can start the game' });
    }

    room.status = 'active';
    await room.save();

    res.json(room);
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

    player.score = score;
    await room.save();

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Room State
exports.getRoomState = async (req, res) => {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
