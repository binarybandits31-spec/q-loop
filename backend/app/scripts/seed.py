"""Curriculum seeder — inserts the 13-module Q-loop curriculum into the database.

Runs on startup if no modules exist. Safe to re-run (idempotent via ON CONFLICT).
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

MODULES_DATA = [
    {"id": "math-foundations", "title": "Mathematical Foundations", "description": "Linear algebra, complex numbers, and probability theory for quantum computing.", "icon": "Sigma", "color": "#22d3ee", "order_index": 1, "objectives": ["Master complex number arithmetic", "Understand linear transformations and unitary matrices", "Apply the tensor product to multi-qubit systems"]},
    {"id": "quantum-foundations", "title": "Quantum Foundations", "description": "Qubits, superposition, measurement, and the postulates of quantum mechanics.", "icon": "Atom", "color": "#34d399", "order_index": 2, "objectives": ["Understand qubit states and the Bloch sphere", "Explain superposition and interference", "Describe the measurement postulate"]},
    {"id": "quantum-circuits", "title": "Quantum Circuits", "description": "Single and multi-qubit gates, circuit construction, and entanglement.", "icon": "CircuitBoard", "color": "#f59e0b", "order_index": 3, "objectives": ["Apply single-qubit gates: H, X, Y, Z, S, T", "Build two-qubit circuits with CNOT and controlled gates", "Create and analyse entangled Bell states"]},
    {"id": "quantum-information", "title": "Quantum Information", "description": "Quantum teleportation, superdense coding, and quantum key distribution.", "icon": "Radio", "color": "#60a5fa", "order_index": 4, "objectives": ["Understand quantum teleportation protocol", "Implement superdense coding", "Grasp the no-cloning theorem"]},
    {"id": "core-algorithms", "title": "Core Quantum Algorithms", "description": "Deutsch-Jozsa, Grover's search, and Shor's factoring algorithm.", "icon": "Binary", "color": "#34d399", "order_index": 5, "objectives": ["Implement the Deutsch-Jozsa algorithm", "Understand Grover oracle and diffusion", "Grasp Shor's reduction to period finding"]},
    {"id": "advanced-algorithms", "title": "Advanced Algorithms", "description": "Quantum phase estimation, amplitude amplification, and Hamiltonian simulation.", "icon": "Cpu", "color": "#a78bfa", "order_index": 6, "objectives": ["Implement quantum phase estimation (QPE)", "Understand amplitude amplification", "Simulate Hamiltonian evolution"]},
    {"id": "quantum-complexity", "title": "Quantum Complexity", "description": "BQP, quantum supremacy, and the limits of quantum computation.", "icon": "Gauge", "color": "#f43f5e", "order_index": 7, "objectives": ["Define BQP and its relationship to P, NP, BPP", "Understand quantum speedup limits", "Explain quantum supremacy experiments"]},
    {"id": "error-correction", "title": "Error Correction & Fault Tolerance", "description": "Quantum error correction codes and fault-tolerant computing.", "icon": "ShieldCheck", "color": "#10b981", "order_index": 8, "objectives": ["Understand decoherence and its effects", "Implement the bit-flip and phase-flip codes", "Explain the Shor code and surface codes"]},
    {"id": "quantum-hardware", "title": "Quantum Hardware", "description": "Superconducting, trapped-ion, photonic, and neutral-atom quantum computers.", "icon": "HardDrive", "color": "#818cf8", "order_index": 9, "objectives": ["Compare hardware platforms by coherence and gate time", "Understand qubit control mechanisms", "Evaluate NISQ device capabilities"]},
    {"id": "quantum-programming", "title": "Quantum Programming", "description": "Qiskit, Cirq, PennyLane, and qBraid — frameworks for writing quantum code.", "icon": "Code2", "color": "#fbbf24", "order_index": 10, "objectives": ["Build and run Qiskit circuits", "Use Aer simulator for experimentation", "Translate circuits between frameworks"]},
    {"id": "quantum-ml", "title": "Quantum Machine Learning", "description": "Quantum kernels, variational classifiers, and quantum neural networks.", "icon": "Brain", "color": "#c084fc", "order_index": 11, "objectives": ["Understand quantum kernel methods", "Implement a variational quantum classifier", "Analyse VQE for optimisation"]},
    {"id": "quantum-applications", "title": "Quantum Applications", "description": "Chemistry, optimization, finance, and cryptography use cases.", "icon": "FlaskConical", "color": "#2dd4bf", "order_index": 12, "objectives": ["Simulate molecular ground states with VQE", "Apply QAOA to combinatorial optimisation", "Understand post-quantum cryptography"]},
    {"id": "research-future", "title": "Research & Future Directions", "description": "Open problems, emerging technologies, and the road ahead.", "icon": "Telescope", "color": "#94a3b8", "order_index": 13, "objectives": ["Understand the path to fault-tolerant quantum computing", "Identify open research questions", "Explore emerging quantum technologies"]},
]

LESSONS_DATA = [
    # --- Math Foundations ---
    {"id": "linear-algebra", "module_id": "math-foundations", "title": "Linear Algebra for Quantum Computing", "description": "Vectors, matrices, and the linear transformations that underpin quantum mechanics.", "duration": 25, "difficulty": "Beginner", "order_index": 1,
     "objectives": ["Understand vectors as quantum states", "Perform matrix multiplication", "Grasp the tensor product"],
     "content": [
         {"heading": "Vectors and State Space", "body": "A quantum state is represented as a vector in a complex vector space. An n-qubit system lives in a 2^n-dimensional space. The state |0⟩ is [1,0]ᵀ and |1⟩ is [0,1]ᵀ."},
         {"heading": "Matrices as Transformations", "body": "Quantum gates are unitary matrices (U·U† = I). When a gate U acts on state |ψ⟩, the new state is U|ψ⟩.", "formula": "U·U† = I (unitary condition)"},
         {"heading": "The Tensor Product", "body": "Combining qubits uses the tensor product (⊗). Two 2D qubits produce a 4D joint space. n qubits span 2^n dimensions."},
     ],
     "quiz": [
         {"id": "q1", "question": "What dimension is the state space of a 3-qubit system?", "options": ["3", "6", "8", "9"], "correctIndex": 2, "explanation": "3 qubits span 2³ = 8 dimensions."},
         {"id": "q2", "question": "What condition must a quantum gate matrix satisfy?", "options": ["Symmetric", "Unitary (U·U† = I)", "Diagonal", "Integer entries"], "correctIndex": 1, "explanation": "Quantum gates are unitary matrices."},
     ]},
    {"id": "complex-numbers", "module_id": "math-foundations", "title": "Complex Numbers and Amplitudes", "description": "Why quantum mechanics uses complex numbers and how amplitudes encode probability.", "duration": 20, "difficulty": "Beginner", "order_index": 2,
     "objectives": ["Understand complex number arithmetic", "Connect amplitudes to probabilities", "Interpret phase"],
     "content": [
         {"heading": "The Complex Plane", "body": "A complex number z = a + bi has real part a and imaginary part b. Quantum amplitudes are complex numbers. Probability = |z|² = a² + b²."},
         {"heading": "Phase and Interference", "body": "The phase of an amplitude is its angle in the complex plane. Amplitudes interfere constructively or destructively, driving quantum algorithms."},
     ],
     "quiz": [{"id": "q1", "question": "How is probability derived from complex amplitude α?", "options": ["|α|", "|α|²", "Re(α)", "Im(α)"], "correctIndex": 1, "explanation": "Probability = |α|², the squared magnitude."}]},
    # --- Quantum Foundations ---
    {"id": "what-is-quantum", "module_id": "quantum-foundations", "title": "What is Quantum Computing?", "description": "Introduction to quantum computing and how it differs from classical computing.", "duration": 15, "difficulty": "Beginner", "order_index": 1,
     "objectives": ["Understand classical vs quantum distinction", "Recognise the qubit", "Appreciate quantum advantage"],
     "content": [
         {"heading": "Classical vs Quantum", "body": "Classical computers use bits (0 or 1). Quantum computers use qubits that can exist in superposition simultaneously, enabling exponential speedups."},
         {"heading": "The Qubit", "body": "A qubit state is α|0⟩ + β|1⟩ where |α|² + |β|² = 1.", "formula": "|ψ⟩ = α|0⟩ + β|1⟩, |α|² + |β|² = 1"},
     ],
     "quiz": [
         {"id": "q1", "question": "What is the key difference between a classical bit and a qubit?", "options": ["Qubit can only be 0", "Qubit can be in superposition", "Qubit is faster", "Qubit uses less energy"], "correctIndex": 1, "explanation": "A qubit can be in superposition of |0⟩ and |1⟩."},
         {"id": "q2", "question": "What constraint do qubit amplitudes satisfy?", "options": ["α + β = 1", "|α|² + |β|² = 1", "α × β = 1", "α = β"], "correctIndex": 1, "explanation": "Normalisation: |α|² + |β|² = 1."},
     ]},
    {"id": "superposition", "module_id": "quantum-foundations", "title": "Superposition", "description": "Explore how qubits can exist in multiple states at once.", "duration": 20, "difficulty": "Beginner", "order_index": 2,
     "objectives": ["Understand the Hadamard gate", "Learn about measurement collapse", "Distinguish |+⟩ and |-⟩"],
     "content": [
         {"heading": "The Hadamard Gate", "body": "H creates superposition: H|0⟩ = |+⟩ = (|0⟩+|1⟩)/√2.", "formula": "H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩"},
         {"heading": "Measuring Superposition", "body": "Measuring |+⟩ collapses it to |0⟩ or |1⟩ each with 50% probability."},
     ],
     "quiz": [
         {"id": "q1", "question": "What does the Hadamard gate do to |0⟩?", "options": ["Flips to |1⟩", "Creates equal superposition", "Adds a phase", "Does nothing"], "correctIndex": 1, "explanation": "H creates the |+⟩ state."},
     ], "circuit_example": '{"qubits":1,"classical_bits":1,"operations":[{"gate":"H","target":0},{"gate":"MEASURE","target":0}]}'},
    {"id": "measurement", "module_id": "quantum-foundations", "title": "Measurement and Collapse", "description": "How measurement destroys superposition and the probabilistic nature of quantum output.", "duration": 15, "difficulty": "Beginner", "order_index": 3,
     "objectives": ["Understand the measurement postulate", "Learn shot-based measurement", "Grasp the no-cloning theorem"],
     "content": [
         {"heading": "The Measurement Postulate", "body": "Measuring |ψ⟩ collapses it. P(|0⟩) = |α|², P(|1⟩) = |β|².", "formula": "P(|0⟩) = |α|², P(|1⟩) = |β|²"},
         {"heading": "Shot-Based Measurement", "body": "Since measurement is probabilistic, run circuits many times (shots) to estimate probabilities."},
     ],
     "quiz": [
         {"id": "q1", "question": "P(|0⟩) from state α|0⟩ + β|1⟩?", "options": ["|α|", "|α|²", "α²", "|α| + |β|"], "correctIndex": 1, "explanation": "P(|0⟩) = |α|²."},
     ]},
    # --- Quantum Circuits ---
    {"id": "single-qubit-gates", "module_id": "quantum-circuits", "title": "Single-Qubit Gates", "description": "Learn the Pauli gates, Hadamard, and phase gates.", "duration": 25, "difficulty": "Beginner", "order_index": 1,
     "objectives": ["Master Pauli X, Y, Z", "Understand S and T phase gates", "Use rotation gates RX, RY, RZ"],
     "content": [
         {"heading": "Pauli Gates", "body": "X (bit flip), Y (bit+phase flip), Z (phase flip). X is the quantum NOT.", "formula": "X|0⟩ = |1⟩, Z|1⟩ = -|1⟩"},
         {"heading": "Phase Gates S and T", "body": "S adds phase π/2, T adds π/4. Essential for precise phase control.", "formula": "S = diag(1, i), T = diag(1, e^{iπ/4})"},
         {"heading": "Rotation Gates", "body": "RX, RY, RZ rotate on the Bloch sphere by angle θ.", "formula": "Rz(θ) = diag(e^{-iθ/2}, e^{iθ/2})"},
     ],
     "quiz": [
         {"id": "q1", "question": "What does Pauli-X do?", "options": ["Flips phase", "Flips bit (|0⟩↔|1⟩)", "Creates superposition", "Adds π phase"], "correctIndex": 1, "explanation": "X is the quantum NOT gate."},
         {"id": "q2", "question": "What phase does S add to |1⟩?", "options": ["π/4", "π/2", "π", "2π"], "correctIndex": 1, "explanation": "S adds phase π/2."},
     ]},
    {"id": "multi-qubit-gates", "module_id": "quantum-circuits", "title": "Multi-Qubit Gates & Entanglement", "description": "CNOT, controlled operations, and entanglement.", "duration": 30, "difficulty": "Intermediate", "order_index": 2,
     "objectives": ["Understand the CNOT gate", "Create Bell states", "Grasp quantum entanglement"],
     "content": [
         {"heading": "The CNOT Gate", "body": "CNOT flips the target qubit if the control is |1⟩.", "formula": "CX|10⟩ = |11⟩, CX|00⟩ = |00⟩"},
         {"heading": "Creating Entanglement", "body": "H on q0, then CNOT(q0,q1) creates the Bell state.", "formula": "|Φ+⟩ = (|00⟩ + |11⟩)/√2"},
     ],
     "quiz": [
         {"id": "q1", "question": "CNOT when control is |0⟩?", "options": ["Flips target", "Does nothing", "Creates superposition", "Adds phase"], "correctIndex": 1, "explanation": "CNOT only flips target when control is |1⟩."},
         {"id": "q2", "question": "Which creates |Φ+⟩?", "options": ["H on q0 then CX(q0,q1)", "X on q0 then CX(q0,q1)", "Z on q0 then H on q1", "H on both"], "correctIndex": 0, "explanation": "H creates superposition; CNOT entangles."},
     ], "circuit_example": '{"qubits":2,"classical_bits":2,"operations":[{"gate":"H","target":0},{"gate":"CX","control":0,"target":1},{"gate":"MEASURE","target":0},{"gate":"MEASURE","target":1}]}'},
    # --- Core Algorithms ---
    {"id": "deutsch-jozsa", "module_id": "core-algorithms", "title": "Deutsch-Jozsa Algorithm", "description": "Determine if a function is constant or balanced with a single query.", "duration": 35, "difficulty": "Intermediate", "order_index": 1,
     "objectives": ["Understand the Deutsch-Jozsa problem", "Follow the quantum circuit", "Appreciate the exponential speedup"],
     "content": [
         {"heading": "The Problem", "body": "Given f:{0,1}^n → {0,1} constant or balanced, determine which. Classical: 2^(n-1)+1 queries. Quantum: 1 query."},
         {"heading": "The Circuit", "body": "H⊗(n+1), oracle Uf, H⊗n, measure. All-zeros → constant; else → balanced."},
     ],
     "quiz": [
         {"id": "q1", "question": "Queries needed by Deutsch-Jozsa?", "options": ["2^n", "n", "1", "log(n)"], "correctIndex": 2, "explanation": "Just one quantum query."},
         {"id": "q2", "question": "All-zeros measurement result means?", "options": ["Constant function", "Balanced function", "Error", "Superposition"], "correctIndex": 0, "explanation": "All zeros → constant."},
     ]},
    {"id": "grovers", "module_id": "core-algorithms", "title": "Grover's Search Algorithm", "description": "Search an unstructured database with quadratic speedup.", "duration": 40, "difficulty": "Advanced", "order_index": 2,
     "objectives": ["Understand the search problem", "Learn oracle and diffusion", "Calculate optimal iterations"],
     "content": [
         {"heading": "The Search Problem", "body": "Find marked item in N items. Classical: O(N). Quantum: O(√N).", "formula": "Iterations ≈ (π/4)√N"},
         {"heading": "Oracle and Diffusion", "body": "Oracle flips phase of marked item. Diffusion amplifies it. Repeat ~π√N/4 times."},
     ],
     "quiz": [
         {"id": "q1", "question": "Grover's speedup?", "options": ["Exponential", "Quadratic O(√N)", "Cubic", "Constant"], "correctIndex": 1, "explanation": "Quadratic speedup."},
         {"id": "q2", "question": "Oracle function?", "options": ["Finds answer", "Flips phase of marked item", "Creates superposition", "Measures"], "correctIndex": 1, "explanation": "Oracle marks the answer by flipping its phase."},
     ]},
    {"id": "shors", "module_id": "core-algorithms", "title": "Shor's Factoring Algorithm", "description": "Factor integers in polynomial time — the algorithm that broke RSA.", "duration": 45, "difficulty": "Advanced", "order_index": 3,
     "objectives": ["Understand factoring as period finding", "See the QFT role", "Appreciate cryptographic impact"],
     "content": [
         {"heading": "The Problem", "body": "Factoring large integers is classically hard. Shor factors in polynomial time, threatening RSA."},
         {"heading": "Period Finding with QFT", "body": "Shor reduces factoring to finding the period r of f(x) = a^x mod N using the Quantum Fourier Transform."},
     ],
     "quiz": [
         {"id": "q1", "question": "What does Shor's solve?", "options": ["Search", "Integer factorization", "Simulation", "Optimization"], "correctIndex": 1, "explanation": "Shor factors integers in polynomial time."},
         {"id": "q2", "question": "Key subroutine?", "options": ["Grover diffusion", "Quantum Fourier Transform", "Phase estimation", "Hadamard"], "correctIndex": 1, "explanation": "QFT finds the period efficiently."},
     ]},
    # Remaining modules get placeholder lessons
    {"id": "phase-estimation", "module_id": "advanced-algorithms", "title": "Quantum Phase Estimation", "description": "Estimate the eigenvalue of a unitary operator.", "duration": 40, "difficulty": "Advanced", "order_index": 1,
     "objectives": ["Understand eigenvalues of unitaries", "Follow QPE circuit", "See role in Shor and chemistry"],
     "content": [
         {"heading": "The Problem", "body": "Given unitary U and eigenstate |ψ⟩, estimate phase φ where U|ψ⟩ = e^{2πiφ}|ψ⟩.", "formula": "U|ψ⟩ = e^{2πiφ}|ψ⟩"},
         {"heading": "QPE Circuit", "body": "Apply H to counting qubits, controlled-U^{2^k}, then inverse QFT. Read off φ."},
     ],
     "quiz": [{"id": "q1", "question": "QPE estimates?", "options": ["A probability", "An eigenvalue phase", "A measurement", "A gate count"], "correctIndex": 1, "explanation": "QPE estimates the phase φ."}]},
    {"id": "bqp-and-bounds", "module_id": "quantum-complexity", "title": "BQP and Complexity Classes", "description": "Where quantum computing fits in the complexity hierarchy.", "duration": 25, "difficulty": "Intermediate", "order_index": 1,
     "objectives": ["Understand BQP", "Compare with P, NP, BPP", "Know quantum speedup limits"],
     "content": [
         {"heading": "The Class BQP", "body": "BQP = problems solvable by quantum computer in polynomial time with bounded error. P ⊆ BPP ⊆ BQP ⊆ PSPACE."},
     ],
     "quiz": [{"id": "q1", "question": "Efficient quantum computation class?", "options": ["P", "NP", "BQP", "PSPACE"], "correctIndex": 2, "explanation": "BQP."}]},
    {"id": "error-correction", "module_id": "error-correction", "title": "Quantum Error Correction", "description": "Protect quantum information from decoherence.", "duration": 45, "difficulty": "Advanced", "order_index": 1,
     "objectives": ["Understand decoherence", "Learn Shor code", "Know surface codes"],
     "content": [
         {"heading": "Decoherence", "body": "Environmental interactions collapse quantum states. Error correction encodes logical qubits in multiple physical qubits."},
         {"heading": "Shor Code", "body": "Encodes 1 logical qubit in 9 physical qubits, correcting arbitrary single-qubit errors."},
     ],
     "quiz": [
         {"id": "q1", "question": "Why is QEC necessary?", "options": ["Speed", "Protect from decoherence", "Reduce qubit count", "Enable entanglement"], "correctIndex": 1, "explanation": "QEC protects from environmental noise."},
         {"id": "q2", "question": "Shor code qubits per logical qubit?", "options": ["1", "3", "5", "9"], "correctIndex": 3, "explanation": "9 physical qubits."},
     ]},
    {"id": "hardware-platforms", "module_id": "quantum-hardware", "title": "Quantum Hardware Platforms", "description": "Overview of the physical platforms for quantum computing.", "duration": 30, "difficulty": "Intermediate", "order_index": 1,
     "objectives": ["Compare hardware platforms", "Understand trade-offs", "Know current state of the art"],
     "content": [
         {"heading": "Superconducting", "body": "Used by IBM and Google. Fast gates (~10ns), short coherence (~100μs)."},
         {"heading": "Trapped Ions", "body": "IonQ and Quantinuum. Long coherence (seconds), slower gates."},
     ],
     "quiz": [{"id": "q1", "question": "Longest coherence times?", "options": ["Superconducting", "Trapped ions", "Photonic", "Silicon spin"], "correctIndex": 1, "explanation": "Trapped ions maintain coherence for seconds."}]},
    {"id": "qiskit-basics", "module_id": "quantum-programming", "title": "Qiskit Fundamentals", "description": "Write quantum circuits with IBM's Qiskit framework.", "duration": 30, "difficulty": "Beginner", "order_index": 1,
     "objectives": ["Create QuantumCircuit", "Apply gates", "Run on simulator"],
     "content": [
         {"heading": "Creating a Circuit", "body": "QuantumCircuit(n, m) creates n-qubit circuit with m classical bits. Apply gates with methods like circuit.h(0), circuit.cx(0,1)."},
         {"heading": "Running on Aer", "body": "Use AerSimulator to run. Execute with shots, get counts from result.", "formula": "result = simulator.run(compiled, shots=1024).result()"},
     ],
     "quiz": [{"id": "q1", "question": "Qiskit circuit class?", "options": ["QuantumGate", "QuantumCircuit", "QuantumProgram", "CircuitBuilder"], "correctIndex": 1, "explanation": "QuantumCircuit."}]},
    {"id": "qml-intro", "module_id": "quantum-ml", "title": "Introduction to Quantum ML", "description": "How quantum computing intersects with machine learning.", "duration": 35, "difficulty": "Advanced", "order_index": 1,
     "objectives": ["Understand quantum advantage in ML", "Learn quantum kernels", "See variational classifiers"],
     "content": [
         {"heading": "Quantum Kernels", "body": "Quantum computers compute inner products in exponentially large feature spaces."},
         {"heading": "Variational Classifiers", "body": "Parameterized quantum circuit as model; classical optimizer tunes parameters."},
     ],
     "quiz": [{"id": "q1", "question": "Quantum kernel?", "options": ["Classical kernel", "Inner product in quantum feature space", "A quantum gate", "Measurement operator"], "correctIndex": 1, "explanation": "Inner products in exponentially large feature spaces."}]},
    {"id": "quantum-chemistry", "module_id": "quantum-applications", "title": "Quantum Chemistry Simulation", "description": "Simulating molecules with quantum computers.", "duration": 30, "difficulty": "Advanced", "order_index": 1,
     "objectives": ["Understand molecular simulation", "See VQE for chemistry", "Appreciate quantum advantage"],
     "content": [
         {"heading": "Why Quantum Chemistry?", "body": "Simulating molecules is classically intractable; the Hilbert space grows exponentially."},
         {"heading": "VQE", "body": "Variational Quantum Eigensolver finds ground state energies with hybrid quantum-classical approach."},
     ],
     "quiz": [{"id": "q1", "question": "Why quantum for chemistry?", "options": ["Faster at everything", "Molecules are quantum systems", "Less energy", "More memory"], "correctIndex": 1, "explanation": "Molecules are inherently quantum."}]},
    {"id": "future-directions", "module_id": "research-future", "title": "The Future of Quantum Computing", "description": "Open challenges and the path to fault-tolerant quantum computing.", "duration": 20, "difficulty": "Intermediate", "order_index": 1,
     "objectives": ["Understand current NISQ limitations", "Know path to fault tolerance", "See emerging directions"],
     "content": [
         {"heading": "The NISQ Era", "body": "Noisy Intermediate-Scale Quantum devices have 50-1000 qubits with high error rates. Finding useful NISQ applications is the key challenge."},
         {"heading": "Path to Fault Tolerance", "body": "Fault-tolerant QC needs 1000+ physical qubits per logical qubit via error correction."},
     ],
     "quiz": [{"id": "q1", "question": "NISQ stands for?", "options": ["Noisy Intermediate-Scale Quantum", "New Integrated System Quantum", "Near Ideal Superconducting Qubits", "Networked Interactive"], "correctIndex": 0, "explanation": "Noisy Intermediate-Scale Quantum."}]},
    # Quantum information
    {"id": "teleportation", "module_id": "quantum-information", "title": "Quantum Teleportation", "description": "Transfer a quantum state across space using entanglement.", "duration": 30, "difficulty": "Intermediate", "order_index": 1,
     "objectives": ["Understand teleportation protocol", "See entanglement as resource", "Learn about classical communication"],
     "content": [
         {"heading": "The Protocol", "body": "Teleport unknown qubit using shared Bell pair and 2 classical bits. Does not violate relativity."},
     ],
     "quiz": [{"id": "q1", "question": "Required for teleportation?", "options": ["Only entanglement", "Entanglement + classical communication", "Only classical", "Nothing"], "correctIndex": 1, "explanation": "Both entanglement and classical communication are required."}]},
    {"id": "superdense-coding", "module_id": "quantum-information", "title": "Superdense Coding", "description": "Send two classical bits using one qubit via entanglement.", "duration": 20, "difficulty": "Intermediate", "order_index": 2,
     "objectives": ["Understand superdense coding", "Compare with teleportation"],
     "content": [{"heading": "The Protocol", "body": "Send 2 classical bits using 1 qubit with pre-shared Bell pair. Alice applies I, X, Z, or XZ; sends qubit to Bob."}],
     "quiz": [{"id": "q1", "question": "Classical bits via superdense coding?", "options": ["1", "2", "4", "Unlimited"], "correctIndex": 1, "explanation": "2 classical bits per qubit."}]},
]

CHALLENGES_DATA = [
    {"id": "bell-state-circuit", "type": "circuit", "title": "Create a Bell State", "description": "Build a circuit producing |Φ+⟩ = (|00⟩ + |11⟩)/√2.", "difficulty": "Beginner", "module_id": "quantum-circuits", "objective": "Histogram must show ~50% |00⟩ and ~50% |11⟩.", "hint": "Apply H to q0, then CNOT(q0, q1).", "max_score": 100, "data": {"id": "bell-state-circuit"}},
    {"id": "superposition-circuit", "type": "circuit", "title": "Create Equal Superposition", "description": "Put a single qubit into equal superposition of |0⟩ and |1⟩.", "difficulty": "Beginner", "module_id": "quantum-foundations", "objective": "Measurement should give ~50% |0⟩ and ~50% |1⟩.", "hint": "Apply H to q0.", "max_score": 100, "data": {"id": "superposition-circuit"}},
    {"id": "ghz-state-circuit", "type": "circuit", "title": "Create a GHZ State", "description": "Build a 3-qubit GHZ state (|000⟩ + |111⟩)/√2.", "difficulty": "Intermediate", "module_id": "quantum-circuits", "objective": "~50% |000⟩ and ~50% |111⟩.", "hint": "H on q0, CX(q0,q1), CX(q1,q2).", "max_score": 100, "data": {"id": "ghz-state-circuit"}},
    {"id": "flip-qubit-circuit", "type": "circuit", "title": "Flip a Qubit", "description": "Transform |0⟩ into |1⟩.", "difficulty": "Beginner", "module_id": "quantum-circuits", "objective": "~100% |1⟩.", "hint": "The X gate is the quantum NOT.", "max_score": 100, "data": {"id": "flip-qubit-circuit"}},
    {"id": "bell-state-code", "type": "coding", "title": "Code a Bell State", "description": "Write Qiskit code creating a Bell state.", "difficulty": "Beginner", "module_id": "quantum-circuits", "objective": "Code must apply H and CX gates and include measurement.", "hint": "circuit.h(0) then circuit.cx(0, 1)", "max_score": 100, "data": {"id": "bell-state-code", "starter_code": "from qiskit import QuantumCircuit\n\ncircuit = QuantumCircuit(2, 2)\n# Add your gates here\n\ncircuit.measure([0,1], [0,1])"}},
    {"id": "superposition-code", "type": "coding", "title": "Code Superposition", "description": "Write Qiskit code putting a qubit into superposition.", "difficulty": "Beginner", "module_id": "quantum-foundations", "objective": "Code must apply H gate.", "hint": "circuit.h(0)", "max_score": 100, "data": {"id": "superposition-code", "starter_code": "from qiskit import QuantumCircuit\n\ncircuit = QuantumCircuit(1, 1)\n# Add your gate here\n\ncircuit.measure([0], [0])"}},
]


async def seed_curriculum(session: AsyncSession) -> None:
    from ..models.module import Module, Lesson
    from ..models.challenge import Challenge

    # Check if data exists
    existing = await session.execute(select(Module).limit(1))
    if existing.scalar_one_or_none():
        return  # Already seeded

    print("[seed] Seeding Q-loop curriculum…")

    for m in MODULES_DATA:
        module = Module(
            id=m["id"],
            title=m["title"],
            description=m["description"],
            icon=m["icon"],
            color=m["color"],
            order_index=m["order_index"],
            objectives=m.get("objectives", []),
        )
        session.add(module)

    await session.flush()

    for l in LESSONS_DATA:
        lesson = Lesson(
            id=l["id"],
            module_id=l["module_id"],
            title=l["title"],
            description=l["description"],
            duration=l["duration"],
            difficulty=l["difficulty"],
            order_index=l["order_index"],
            objectives=l.get("objectives", []),
            content=l.get("content", []),
            quiz=l.get("quiz", []),
            circuit_example=l.get("circuit_example"),
        )
        session.add(lesson)

    await session.flush()

    for c in CHALLENGES_DATA:
        challenge = Challenge(
            id=c["id"],
            type=c["type"],
            title=c["title"],
            description=c["description"],
            difficulty=c["difficulty"],
            module_id=c.get("module_id"),
            objective=c.get("objective"),
            hint=c.get("hint"),
            max_score=c["max_score"],
            data=c.get("data", {}),
        )
        session.add(challenge)

    await session.commit()
    print("[seed] Curriculum seeded successfully.")
