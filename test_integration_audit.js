const jwt = require('jsonwebtoken');
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'kiit_quest_dev_jwt_secret_key_2026';

const runTests = async () => {
  console.log('🚀 Starting KIIT QUEST Dual-Backend Integration Regression Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  };

  // 1. Strict Authentication Boundary Tests
  console.log('--- Test Suite 1: Cryptographic Authentication Boundaries ---');
  try {
    // 1.1 Unauthenticated request on protected route MUST return 401
    try {
      await axios.get(`${BASE_URL}/api/pyq/subjects?school=School+of+Computer+Engineering&branch=(CSE)&semester=5`);
      assert(false, 'Unauthenticated request to /api/pyq/subjects should be rejected with 401');
    } catch (err) {
      assert(err.response && err.response.status === 401, 'Unauthenticated request to /api/pyq/subjects correctly rejected with 401');
    }

    // 1.2 Forged unsigned/tampered token MUST return 401
    const forgedToken = jwt.sign({ id: 'victim_student_999', role: 'admin' }, 'wrong_bogus_secret');
    try {
      await axios.get(`${BASE_URL}/api/pyq/subjects?school=School+of+Computer+Engineering&branch=(CSE)&semester=5`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      assert(false, 'Forged JWT with invalid signature must be rejected with 401');
    } catch (err) {
      assert(err.response && err.response.status === 401, 'Forged JWT signature rejected with 401 (no decode bypass)');
    }

    // 1.3 Valid signed token MUST be accepted
    const validStudentId = '6543210987abcdef01234567';
    const validToken = jwt.sign({
      id: validStudentId,
      email: '2105123@kiit.ac.in',
      name: 'Abhishek Kumar',
      role: 'student'
    }, JWT_SECRET, { expiresIn: '1h' });

    // 2. Anonymous / Guest Practice Allowance
    console.log('\n--- Test Suite 2: Practice Generation & Guest Scoping ---');
    try {
      const genRes = await axios.get(`${BASE_URL}/api/quest/generate`, {
        params: {
          branch: '(CSE) Computer Science & Engineering',
          semester: 'Semester 5',
          subject: 'Computer Networks',
          limit: 3
        }
      });
      assert(genRes.status === 200 && Array.isArray(genRes.data) && genRes.data.length > 0, 'Guest student can generate practice questions without crash');
    } catch (err) {
      assert(false, `Guest practice generation failed: ${err.message}`);
    }

    // 3. Academic Curriculum Scope Validation
    console.log('\n--- Test Suite 3: Invariant 1 (Authorized KIIT Curriculum Scope) ---');
    try {
      const validTopicRes = await axios.get(`${BASE_URL}/api/quest/topics`, {
        params: { subject: 'Computer Networks' }
      });
      assert(validTopicRes.status === 200 && validTopicRes.data.course_code === 'CS-30003', 'Authorized subject "Computer Networks" correctly maps to CS-30003');
    } catch (err) {
      assert(false, `Valid curriculum topic fetch failed: ${err.message}`);
    }

    try {
      await axios.get(`${BASE_URL}/api/quest/topics`, {
        params: { subject: 'Astrophysics and Quantum Relics' }
      });
      assert(false, 'Unauthorized subject must be rejected with 400 Bad Request');
    } catch (err) {
      assert(err.response && err.response.status === 400, 'Unauthorized subject rejected with 400 Bad Request');
    }

    // 4. Anti-Cheat Answer Key Secrecy in Battle Ground
    console.log('\n--- Test Suite 4: Invariant 5 (Zero Answer Leakage in Multiplayer) ---');
    let roomCode = null;
    try {
      const createRes = await axios.post(`${BASE_URL}/api/quest/room/create`, {
        branch: '(CSE) Computer Science & Engineering',
        semester: 'Semester 5',
        subject: 'Computer Networks',
        questionCount: 3
      }, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(createRes.status === 201 && createRes.data.code, 'Battle Ground room created successfully');
      roomCode = createRes.data.code;

      const roomQuestions = createRes.data.questions || [];
      assert(roomQuestions.length > 0, 'Room contains question list');

      // Verify ZERO correctAnswer and ZERO explanation in createRoom response
      const hasLeakedKey = roomQuestions.some(q => q.correctAnswer || q.explanation);
      assert(!hasLeakedKey, 'createRoom response has ZERO correctAnswer and ZERO explanation leakage');

      // Verify ZERO answer leakage in getRoomState polling
      const pollRes = await axios.get(`${BASE_URL}/api/quest/room/${roomCode}`, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      const pollQuestions = pollRes.data.questions || [];
      const pollLeaked = pollQuestions.some(q => q.correctAnswer || q.explanation);
      assert(!pollLeaked, 'getRoomState polling has ZERO correctAnswer and ZERO explanation leakage');

      // Verify startRoomGame also scrubs answer keys
      const startRes = await axios.post(`${BASE_URL}/api/quest/room/start`, { code: roomCode }, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(startRes.status === 200 && startRes.data.status === 'in_progress', 'Multiplayer room game started');
      const startQuestions = startRes.data.questions || [];
      assert(!startQuestions.some(q => q.correctAnswer || q.explanation), 'startRoomGame has ZERO answer key leakage');

      // Submit room answers and verify room finishes
      const roomSubRes = await axios.post(`${BASE_URL}/api/quest/room/submit`, {
        code: roomCode,
        answers: roomQuestions.map((q, idx) => ({
          question_id: q.id || q.question_id,
          selected_options: (q.options && q.options.length > 0) ? [q.options[0]] : []
        }))
      }, {
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(roomSubRes.status === 200 && roomSubRes.data.success, 'Multiplayer answer submission accepted');
      assert(roomSubRes.data.room && roomSubRes.data.room.status === 'finished', 'Room status transitioned to finished after all players submitted');
    } catch (err) {
      assert(false, `Battle ground anti-cheat test error: ${err.message}`);
    }

    // 5. Authoritative Server-Side Fallback Grading
    console.log('\n--- Test Suite 5: Fallback Grading Accuracy (No Free 100% Exploit) ---');
    try {
      const submitRes = await axios.post(`${BASE_URL}/api/quest/submit`, {
        attempt_id: 'local-fallback',
        answers: [
          { question_id: 'local-fb-0', selected_options: ['Stack'] }, // Correct (LIFO)
          { question_id: 'local-fb-1', selected_options: ['O(1)'] }    // Wrong (worst case QuickSort is O(N^2))
        ]
      });
      assert(submitRes.status === 200, 'local-fallback quiz submit succeeded');
      assert(submitRes.data.correct_count === 1, `Accurate grading: expected 1 correct, got ${submitRes.data.correct_count}`);
      assert(submitRes.data.score === 10, `Accurate score: expected 10 XP, got ${submitRes.data.score}`);
    } catch (err) {
      assert(false, `Fallback grading test error: ${err.message}`);
    }

    // 6. Existing PYQ and Materials Compatibility
    console.log('\n--- Test Suite 6: Existing PYQ & Materials Backward Compatibility ---');
    try {
      const pyqRes = await axios.get(`${BASE_URL}/api/pyq/subjects`, {
        params: {
          school: 'School of Computer Engineering',
          branch: '(CSE) Computer Science & Engineering',
          semester: 'Semester 5'
        },
        headers: { Authorization: `Bearer ${validToken}` }
      });
      assert(pyqRes.status === 200 && Array.isArray(pyqRes.data), 'PYQ subjects endpoint returned 200 with collection data');
    } catch (err) {
      assert(false, `PYQ subjects retrieval error: ${err.message}`);
    }

  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Regression Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
