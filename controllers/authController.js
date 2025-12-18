const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, school, branch, semester, phone } = req.body;

    // ... (rest of your validation code)

    try {
        const user = await User.create({ name, email, password, school, branch, semester, phone });
        if (user) {
            res.status(201).json({
                _id: user._id, 
                name: user.name, 
                email: user.email,
                school: user.school, 
                branch: user.branch, 
                semester: user.semester,
                phone: user.phone,
                role: user.role, // ✅ ADD THIS LINE
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data', error: error.message });
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            school: user.school, 
            branch: user.branch, 
            semester: user.semester,
            phone: user.phone,
            role: user.role, // ✅ ADD THIS LINE
            token: generateToken(user._id),
        });
    } else { 
        res.status(401); 
        throw new Error('Invalid email or password'); 
    }
});