export interface LessonContent { heading: string; body: string; formula?: string }
export interface QuizQuestion { id: string; question: string; options: string[]; correctIndex: number; explanation: string }
export interface Lesson {
  id: string; moduleId: string; title: string; description: string
  duration: number; difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  objectives: string[]; content: LessonContent[]; quiz: QuizQuestion[]; circuitExample?: string
}
export interface Module {
  id: string; title: string; description: string; icon: string; color: string; lessons: Lesson[]
}

export const MODULES: Module[] = [
  { id: 'math-foundations', title: 'Mathematical Foundations', description: 'Linear algebra, complex numbers, and probability theory for quantum computing.', icon: 'Sigma', color: '#22d3ee', lessons: [
    { id: 'linear-algebra', moduleId: 'math-foundations', title: 'Linear Algebra for Quantum Computing', description: 'Vectors, matrices, and the linear transformations that underpin quantum mechanics.', duration: 25, difficulty: 'Beginner', objectives: ['Understand vectors as quantum states', 'Perform matrix multiplication', 'Grasp the tensor product'], content: [
      { heading: 'Vectors and State Space', body: 'A quantum state is represented as a vector in a complex vector space. An n-qubit system lives in a 2^n-dimensional space. Each basis vector corresponds to a classical bit string. The state |0⟩ is the column vector [1, 0]ᵀ and |1⟩ is [0, 1]ᵀ.' },
      { heading: 'Matrices as Transformations', body: 'Quantum gates are unitary matrices — square matrices whose conjugate transpose equals their inverse. When a gate U acts on state |ψ⟩, the new state is U|ψ⟩. Matrix multiplication is the core operation of quantum computing.', formula: 'U·U† = I (unitary condition)' },
      { heading: 'The Tensor Product', body: 'When combining qubits, their state spaces combine via the tensor product (⊗). Two single qubits each in 2D space produce a joint 4D space. This is why n qubits span 2^n dimensions — the source of quantum parallelism.' },
    ], quiz: [
      { id: 'q1', question: 'What dimension is the state space of a 3-qubit system?', options: ['3', '6', '8', '9'], correctIndex: 2, explanation: '3 qubits span 2³ = 8 dimensions.' },
      { id: 'q2', question: 'What condition must a quantum gate matrix satisfy?', options: ['It must be symmetric', 'It must be unitary (U·U† = I)', 'It must be diagonal', 'It must have integer entries'], correctIndex: 1, explanation: 'Quantum gates are unitary matrices.' },
    ] },
    { id: 'complex-numbers', moduleId: 'math-foundations', title: 'Complex Numbers and Amplitudes', description: 'Why quantum mechanics uses complex numbers and how amplitudes encode probability.', duration: 20, difficulty: 'Beginner', objectives: ['Understand complex number arithmetic', 'Connect amplitudes to probabilities', 'Interpret phase'], content: [
      { heading: 'The Complex Plane', body: 'A complex number z = a + bi has a real part a and imaginary part b. Quantum amplitudes are complex numbers. The probability of measuring a state is the squared magnitude |z|² = a² + b².' },
      { heading: 'Phase and Interference', body: 'The phase of an amplitude is its angle in the complex plane. When amplitudes with different phases combine, they can interfere constructively (add) or destructively (cancel). This interference is the engine behind quantum algorithms.' },
    ], quiz: [
      { id: 'q1', question: 'How is probability derived from a complex amplitude α?', options: ['|α|', '|α|²', 'Re(α)', 'Im(α)'], correctIndex: 1, explanation: 'Probability is the squared magnitude |α|².' },
    ] },
  ]},
  { id: 'quantum-foundations', title: 'Quantum Foundations', description: 'Qubits, superposition, measurement, and the postulates of quantum mechanics.', icon: 'Atom', color: '#34d399', lessons: [
    { id: 'what-is-quantum', moduleId: 'quantum-foundations', title: 'What is Quantum Computing?', description: 'Introduction to quantum computing and how it differs from classical computing.', duration: 15, difficulty: 'Beginner', objectives: ['Understand the classical vs quantum distinction', 'Recognize the qubit', 'Appreciate quantum advantage'], content: [
      { heading: 'Classical vs Quantum', body: 'Classical computers use bits (0 or 1). Quantum computers use qubits, which can exist in superposition — a combination of 0 and 1 simultaneously. This enables exponential speedups for certain problems.' },
      { heading: 'The Qubit', body: 'A qubit is the basic unit of quantum information. Its state is described by two complex amplitudes α and β, where |α|² + |β|² = 1.', formula: '|ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1' },
      { heading: 'Why Quantum Matters', body: 'Quantum computers excel at factoring (Shor), search (Grover), and quantum simulation — problems intractable for classical machines.' },
    ], quiz: [
      { id: 'q1', question: 'What is the fundamental difference between a classical bit and a qubit?', options: ['A qubit can only be 0', 'A qubit can be in superposition of 0 and 1', 'A qubit is faster', 'A qubit uses less energy'], correctIndex: 1, explanation: 'A qubit can exist in a superposition of |0⟩ and |1⟩ simultaneously.' },
      { id: 'q2', question: 'What constraint must qubit amplitudes satisfy?', options: ['α + β = 1', '|α|² + |β|² = 1', 'α × β = 1', 'α = β'], correctIndex: 1, explanation: 'The normalization condition: |α|² + |β|² = 1.' },
    ] },
    { id: 'superposition', moduleId: 'quantum-foundations', title: 'Superposition', description: 'Explore how qubits can exist in multiple states at once.', duration: 20, difficulty: 'Beginner', objectives: ['Understand the Hadamard gate', 'Learn about measurement collapse', 'Distinguish |+⟩ and |-⟩ states'], content: [
      { heading: 'The Hadamard Gate', body: 'The H gate creates superposition. Applied to |0⟩, it creates |+⟩ = (1/√2)(|0⟩ + |1⟩). Applied to |1⟩, it creates |-⟩ = (1/√2)(|0⟩ - |1⟩).', formula: 'H|0⟩ = (1/√2)(|0⟩ + |1⟩) = |+⟩' },
      { heading: 'Measuring Superposition', body: 'Measuring a qubit in superposition collapses it to |0⟩ or |1⟩. For |+⟩, each outcome has 50% probability.' },
      { heading: 'The Minus State', body: 'H|1⟩ produces |-⟩. While |+⟩ and |-⟩ both give 50/50 measurement outcomes, they differ in phase and behave differently under further gates.' },
    ], quiz: [
      { id: 'q1', question: 'What does the Hadamard gate do to |0⟩?', options: ['Flips it to |1⟩', 'Creates equal superposition of |0⟩ and |1⟩', 'Adds a phase', 'Does nothing'], correctIndex: 1, explanation: 'H creates the |+⟩ state, an equal superposition.' },
      { id: 'q2', question: 'What happens when you measure a qubit in superposition?', options: ['It stays in superposition', 'It collapses to |0⟩ or |1⟩', 'It becomes entangled', 'Nothing happens'], correctIndex: 1, explanation: 'Measurement collapses the superposition to a definite state.' },
    ], circuitExample: '{"gates":[{"type":"H","qubit":0}],"numQubits":1}' },
    { id: 'measurement', moduleId: 'quantum-foundations', title: 'Measurement and Collapse', description: 'Understand how measurement destroys superposition and the probabilistic nature of quantum computing.', duration: 15, difficulty: 'Beginner', objectives: ['Understand the measurement postulate', 'Learn about shot-based measurement', 'Grasp the no-cloning theorem'], content: [
      { heading: 'The Measurement Postulate', body: 'Measurement collapses a quantum state to a classical outcome. The probability of each outcome is the squared magnitude of the amplitude.', formula: 'P(|0⟩) = |α|², P(|1⟩) = |β|²' },
      { heading: 'Shot-Based Measurement', body: 'Since measurement is probabilistic, we run circuits many times (shots) to build a probability distribution. 1024 shots of a Hadamard circuit gives roughly 500 zeros and 500 ones.' },
      { heading: 'The No-Cloning Theorem', body: 'You cannot copy an unknown quantum state. This is fundamental to quantum security but means measurement is destructive.' },
    ], quiz: [
      { id: 'q1', question: 'What is the probability of measuring |0⟩ from state α|0⟩ + β|1⟩?', options: ['|α|', '|α|²', 'α²', '|α| + |β|'], correctIndex: 1, explanation: 'P(|0⟩) = |α|², the squared magnitude.' },
      { id: 'q2', question: 'Why do we run quantum circuits multiple times?', options: ['To get exact results', 'Because quantum measurement is probabilistic', 'To reduce noise', 'It is required by the hardware'], correctIndex: 1, explanation: 'Quantum measurement is probabilistic, so we run many shots to estimate probabilities.' },
    ] },
  ]},
  { id: 'quantum-circuits', title: 'Quantum Circuits', description: 'Single and multi-qubit gates, circuit construction, and entanglement.', icon: 'CircuitBoard', color: '#f59e0b', lessons: [
    { id: 'single-qubit-gates', moduleId: 'quantum-circuits', title: 'Single-Qubit Gates', description: 'Learn the Pauli gates, Hadamard, and phase gates.', duration: 25, difficulty: 'Beginner', objectives: ['Master Pauli X, Y, Z gates', 'Understand phase gates S and T', 'Use rotation gates RX, RY, RZ'], content: [
      { heading: 'Pauli Gates', body: 'X (bit flip), Y (bit+phase flip), and Z (phase flip). X is the quantum NOT. Z flips the phase of |1⟩.', formula: 'X = [[0,1],[1,0]], Z = [[1,0],[0,-1]], Y = [[0,-i],[i,0]]' },
      { heading: 'Phase Gates S and T', body: 'S adds a phase of π/2 to |1⟩. T adds π/4. These are crucial for algorithms relying on precise phase relationships.', formula: 'S = [[1,0],[0,i]], T = [[1,0],[0,e^(iπ/4)]]' },
      { heading: 'Rotation Gates', body: 'RX, RY, RZ rotate the qubit around X, Y, Z axes by angle θ. These parameterized gates are essential for variational algorithms.', formula: 'Rz(θ) = [[e^(-iθ/2), 0], [0, e^(iθ/2)]]' },
    ], quiz: [
      { id: 'q1', question: 'What does the Pauli-X gate do?', options: ['Flips the phase', 'Flips the bit (|0⟩ ↔ |1⟩)', 'Creates superposition', 'Adds a phase of π'], correctIndex: 1, explanation: 'X is the quantum NOT gate.' },
      { id: 'q2', question: 'What phase does the S gate add to |1⟩?', options: ['π/4', 'π/2', 'π', '2π'], correctIndex: 1, explanation: 'S adds a phase of π/2 (90°).' },
    ], circuitExample: '{"gates":[{"type":"X","qubit":0},{"type":"Z","qubit":0}],"numQubits":1}' },
    { id: 'multi-qubit-gates', moduleId: 'quantum-circuits', title: 'Multi-Qubit Gates & Entanglement', description: 'Explore CNOT, controlled operations, and the phenomenon of entanglement.', duration: 30, difficulty: 'Intermediate', objectives: ['Understand the CNOT gate', 'Create Bell states', 'Grasp quantum entanglement'], content: [
      { heading: 'The CNOT Gate', body: 'CNOT (CX) operates on two qubits: control and target. If control is |1⟩, it flips the target. CNOT is the primary gate for creating entanglement.', formula: 'CX|10⟩ = |11⟩, CX|00⟩ = |00⟩' },
      { heading: 'Creating Entanglement', body: 'Apply H to q0, then CNOT(q0, q1). This creates the Bell state — a maximally entangled two-qubit state.', formula: '|Φ+⟩ = (1/√2)(|00⟩ + |11⟩)' },
      { heading: 'Bell States', body: 'Four Bell states exist, each maximally entangled. Measuring one qubit instantly determines the other — "spooky action at a distance."' },
    ], quiz: [
      { id: 'q1', question: 'What does CNOT do when the control qubit is |0⟩?', options: ['Flips the target', 'Does nothing', 'Creates superposition', 'Adds a phase'], correctIndex: 1, explanation: 'CNOT only flips the target when control is |1⟩.' },
      { id: 'q2', question: 'Which circuit creates the Bell state |Φ+⟩?', options: ['H on q0, then CX(q0,q1)', 'X on q0, then CX(q0,q1)', 'Z on q0, then H on q1', 'Just H on both qubits'], correctIndex: 0, explanation: 'H creates superposition, CNOT entangles the qubits.' },
    ], circuitExample: '{"gates":[{"type":"H","qubit":0},{"type":"CX","qubit":0,"controlQubit":0,"targetQubit":1}],"numQubits":2}' },
  ]},
  { id: 'quantum-information', title: 'Quantum Information', description: 'Quantum teleportation, superdense coding, and quantum key distribution.', icon: 'Radio', color: '#60a5fa', lessons: [
    { id: 'teleportation', moduleId: 'quantum-information', title: 'Quantum Teleportation', description: 'Transfer a quantum state across space using entanglement.', duration: 30, difficulty: 'Intermediate', objectives: ['Understand the teleportation protocol', 'See entanglement as a resource', 'Learn about classical communication'], content: [
      { heading: 'The Protocol', body: 'Quantum teleportation transfers an unknown qubit state from Alice to Bob using a shared Bell pair and two classical bits. It does not violate relativity because classical communication is required.' },
      { heading: 'Circuit Steps', body: '1. Create a Bell pair shared between Alice and Bob. 2. Alice applies CNOT(q_unknown, q_alice) then H(q_unknown). 3. Alice measures both qubits. 4. Alice sends results to Bob. 5. Bob applies X and Z corrections based on the classical bits.' },
    ], quiz: [
      { id: 'q1', question: 'What is required to complete quantum teleportation?', options: ['Only entanglement', 'Entanglement + classical communication', 'Only classical communication', 'Nothing extra'], correctIndex: 1, explanation: 'Both entanglement and classical communication are required.' },
    ] },
    { id: 'superdense-coding', moduleId: 'quantum-information', title: 'Superdense Coding', description: 'Send two classical bits using one qubit, leveraging entanglement.', duration: 20, difficulty: 'Intermediate', objectives: ['Understand superdense coding', 'Compare with teleportation', 'See the duality with teleportation'], content: [
      { heading: 'The Protocol', body: 'Superdense coding is the reverse of teleportation: it sends 2 classical bits using 1 qubit, but requires a pre-shared entangled pair. Alice applies one of I, X, Z, or XZ to her half of the Bell pair, then sends her qubit to Bob.' },
    ], quiz: [
      { id: 'q1', question: 'How many classical bits can be sent with one qubit via superdense coding?', options: ['1', '2', '4', 'Unlimited'], correctIndex: 1, explanation: 'Superdense coding sends 2 classical bits using 1 qubit (with pre-shared entanglement).' },
    ] },
  ]},
  { id: 'core-algorithms', title: 'Core Quantum Algorithms', description: 'Deutsch-Jozsa, Grover\'s search, and Shor\'s factoring algorithm.', icon: 'Binary', color: '#34d399', lessons: [
    { id: 'deutsch-jozsa', moduleId: 'core-algorithms', title: 'Deutsch-Jozsa Algorithm', description: 'Determine if a function is constant or balanced with a single query.', duration: 35, difficulty: 'Intermediate', objectives: ['Understand the problem', 'Follow the quantum circuit', 'Appreciate the exponential speedup'], content: [
      { heading: 'The Problem', body: 'Given f: {0,1}^n → {0,1} that is either constant or balanced, determine which. Classically requires up to 2^(n-1)+1 queries. Quantum: just 1.' },
      { heading: 'The Circuit', body: 'Apply H to all n+1 qubits, apply the oracle, apply H again to the first n qubits, measure. All zeros → constant; otherwise → balanced.' },
    ], quiz: [
      { id: 'q1', question: 'How many queries does Deutsch-Jozsa need?', options: ['2^n', 'n', '1', 'log(n)'], correctIndex: 2, explanation: 'The quantum algorithm needs just a single query.' },
      { id: 'q2', question: 'What measurement result indicates a constant function?', options: ['All zeros', 'All ones', 'Any non-zero result', 'Alternating bits'], correctIndex: 0, explanation: 'All zeros means constant; any other result means balanced.' },
    ] },
    { id: 'grovers', moduleId: 'core-algorithms', title: "Grover's Search Algorithm", description: 'Search an unstructured database with quadratic speedup.', duration: 40, difficulty: 'Advanced', objectives: ['Understand the search problem', 'Learn the oracle and diffusion', 'Calculate the optimal iteration count'], content: [
      { heading: 'The Search Problem', body: 'Find a marked item in an unstructured database of N items. Classical: O(N). Quantum: O(√N) — a quadratic speedup.', formula: 'Classical: O(N), Quantum: O(√N)' },
      { heading: 'The Oracle', body: 'The oracle flips the phase of the marked item, encoding the problem without revealing the answer directly.' },
      { heading: 'Grover Diffusion', body: 'After the oracle, the diffusion operator amplifies the marked state. After ~π/4 × √N iterations, measure to get the answer with high probability.', formula: 'Iterations ≈ (π/4)√N' },
    ], quiz: [
      { id: 'q1', question: 'What speedup does Grover\'s algorithm provide?', options: ['Exponential', 'Quadratic (O(√N))', 'Cubic', 'Constant'], correctIndex: 1, explanation: 'Grover\'s provides a quadratic speedup: O(√N) vs O(N).' },
      { id: 'q2', question: 'What does the Grover oracle do?', options: ['Finds the answer', 'Flips the phase of the marked item', 'Creates superposition', 'Measures the result'], correctIndex: 1, explanation: 'The oracle marks the answer by flipping its phase.' },
    ] },
    { id: 'shors', moduleId: 'core-algorithms', title: "Shor's Factoring Algorithm", description: 'Factor integers in polynomial time — the algorithm that broke RSA.', duration: 45, difficulty: 'Advanced', objectives: ['Understand factoring as period finding', 'See the quantum Fourier transform', 'Appreciate the impact on cryptography'], content: [
      { heading: 'The Problem', body: 'Factoring large integers is believed to be classically hard. Shor\'s algorithm factors in polynomial time, threatening RSA encryption.' },
      { heading: 'Period Finding', body: 'Shor reduces factoring to finding the period of a function f(x) = a^x mod N. The quantum part uses the Quantum Fourier Transform (QFT) to find this period efficiently.' },
      { heading: 'The QFT', body: 'The Quantum Fourier Transform is the quantum analogue of the discrete Fourier transform. It transforms from the computational basis to the Fourier basis, revealing periodicity.' },
    ], quiz: [
      { id: 'q1', question: 'What problem does Shor\'s algorithm solve?', options: ['Search', 'Integer factorization', 'Simulation', 'Optimization'], correctIndex: 1, explanation: 'Shor\'s algorithm factors integers in polynomial time.' },
      { id: 'q2', question: 'What quantum subroutine does Shor\'s algorithm use?', options: ['Grover diffusion', 'Quantum Fourier Transform', 'Phase estimation only', 'Hadamard transform'], correctIndex: 1, explanation: 'Shor uses the QFT to find the period of a modular exponentiation function.' },
    ] },
  ]},
  { id: 'advanced-algorithms', title: 'Advanced Algorithms', description: 'Quantum phase estimation, amplitude amplification, and Hamiltonian simulation.', icon: 'Cpu', color: '#a78bfa', lessons: [
    { id: 'phase-estimation', moduleId: 'advanced-algorithms', title: 'Quantum Phase Estimation', description: 'Estimate the eigenvalue of a unitary operator.', duration: 40, difficulty: 'Advanced', objectives: ['Understand eigenvalues of unitaries', 'Follow the QPE circuit', 'See its role in Shor\'s and chemistry'], content: [
      { heading: 'The Problem', body: 'Given a unitary U and an eigenstate |ψ⟩, estimate the phase φ where U|ψ⟩ = e^(2πiφ)|ψ⟩. This is a core subroutine in many quantum algorithms.' },
      { heading: 'The Circuit', body: 'QPE uses a register of n counting qubits and a target register. Apply H to counting qubits, apply controlled-U^(2^k) operations, then apply the inverse QFT to the counting register.' },
    ], quiz: [
      { id: 'q1', question: 'What does QPE estimate?', options: ['A probability', 'An eigenvalue phase', 'A measurement outcome', 'A gate count'], correctIndex: 1, explanation: 'QPE estimates the phase φ in U|ψ⟩ = e^(2πiφ)|ψ⟩.' },
    ] },
  ]},
  { id: 'quantum-complexity', title: 'Quantum Complexity', description: 'BQP, quantum supremacy, and the limits of quantum computation.', icon: 'Gauge', color: '#f43f5e', lessons: [
    { id: 'bqp-and-bounds', moduleId: 'quantum-complexity', title: 'BQP and Complexity Classes', description: 'Where quantum computing fits in the complexity hierarchy.', duration: 25, difficulty: 'Intermediate', objectives: ['Understand BQP', 'Compare with P, NP, BPP', 'Know the limits of quantum speedups'], content: [
      { heading: 'The Class BQP', body: 'BQP (Bounded-Error Quantum Polynomial time) is the class of problems solvable by a quantum computer in polynomial time with bounded error. It contains BPP and is believed to be strictly larger.' },
      { heading: 'Known Relationships', body: 'P ⊆ BPP ⊆ BQP ⊆ PSPACE. Whether BQP contains NP is an open question. Factoring is in BQP but not known to be NP-complete.' },
    ], quiz: [
      { id: 'q1', question: 'What complexity class describes efficient quantum computation?', options: ['P', 'NP', 'BQP', 'PSPACE'], correctIndex: 2, explanation: 'BQP is the class of problems efficiently solvable by quantum computers.' },
    ] },
  ]},
  { id: 'error-correction', title: 'Error Correction & Fault Tolerance', description: 'Quantum error correction codes and fault-tolerant computing.', icon: 'ShieldCheck', color: '#10b981', lessons: [
    { id: 'error-correction', moduleId: 'error-correction', title: 'Quantum Error Correction', description: 'Protect quantum information from decoherence.', duration: 45, difficulty: 'Advanced', objectives: ['Understand decoherence', 'Learn the Shor code', 'Know surface codes'], content: [
      { heading: 'The Challenge of Decoherence', body: 'Quantum states are fragile. Environmental interactions cause decoherence. Error correction encodes logical qubits into multiple physical qubits.' },
      { heading: 'The Shor Code', body: 'Peter Shor\'s 9-qubit code encodes one logical qubit into 9 physical qubits, correcting arbitrary single-qubit errors by combining bit-flip and phase-flip correction.' },
      { heading: 'Surface Codes', body: 'Modern approaches use surface codes — a 2D lattice where errors are detected by measuring stabilizer operators. Surface codes are the leading approach for fault-tolerant quantum computing.' },
    ], quiz: [
      { id: 'q1', question: 'Why is quantum error correction necessary?', options: ['To speed up computation', 'To protect fragile quantum states from decoherence', 'To reduce qubit count', 'To enable entanglement'], correctIndex: 1, explanation: 'Quantum states are extremely fragile and need protection from environmental noise.' },
      { id: 'q2', question: 'How many qubits does the Shor code use per logical qubit?', options: ['1', '3', '5', '9'], correctIndex: 3, explanation: 'The Shor code uses 9 physical qubits per logical qubit.' },
    ] },
  ]},
  { id: 'quantum-hardware', title: 'Quantum Hardware', description: 'Superconducting, trapped-ion, photonic, and neutral-atom quantum computers.', icon: 'HardDrive', color: '#818cf8', lessons: [
    { id: 'hardware-platforms', moduleId: 'quantum-hardware', title: 'Quantum Hardware Platforms', description: 'Overview of the physical platforms for quantum computing.', duration: 30, difficulty: 'Intermediate', objectives: ['Compare hardware platforms', 'Understand trade-offs', 'Know current state of the art'], content: [
      { heading: 'Superconducting Qubits', body: 'Used by IBM and Google. Fast gate times (~10ns) but short coherence times (~100μs). Currently the most widely available platform via cloud access.' },
      { heading: 'Trapped Ions', body: 'Used by IonQ and Quantinuum. Long coherence times (seconds to minutes) but slower gates. High-fidelity operations.' },
      { heading: 'Photonic and Neutral Atoms', body: 'Photonic qubits use light particles. Neutral atom arrays (e.g., QuEra) use laser-trapped atoms. Both are promising for scalability.' },
    ], quiz: [
      { id: 'q1', question: 'Which hardware has the longest coherence times?', options: ['Superconducting', 'Trapped ions', 'Photonic', 'Silicon spin'], correctIndex: 1, explanation: 'Trapped ions can maintain coherence for seconds to minutes.' },
    ] },
  ]},
  { id: 'quantum-programming', title: 'Quantum Programming', description: 'Qiskit, Cirq, PennyLane, and qBraid — frameworks for writing quantum code.', icon: 'Code2', color: '#fbbf24', lessons: [
    { id: 'qiskit-basics', moduleId: 'quantum-programming', title: 'Qiskit Fundamentals', description: 'Write quantum circuits with IBM\'s Qiskit framework.', duration: 30, difficulty: 'Beginner', objectives: ['Create a QuantumCircuit', 'Apply gates', 'Run on a simulator'], content: [
      { heading: 'Creating a Circuit', body: 'In Qiskit, you create a QuantumCircuit with n qubits and m classical bits. Gates are applied with methods like circuit.h(0), circuit.cx(0, 1), circuit.measure([0,1], [0,1]).' },
      { heading: 'Running on Aer', body: 'Use Aer\'s qasm_simulator to run circuits. Execute with a number of shots, then get counts from the result object.', formula: 'result = execute(circuit, simulator, shots=1024).result()' },
    ], quiz: [
      { id: 'q1', question: 'Which class creates a quantum circuit in Qiskit?', options: ['QuantumGate', 'QuantumCircuit', 'QuantumProgram', 'CircuitBuilder'], correctIndex: 1, explanation: 'QuantumCircuit is the main class for building circuits in Qiskit.' },
    ] },
  ]},
  { id: 'quantum-ml', title: 'Quantum Machine Learning', description: 'Quantum kernels, variational classifiers, and quantum neural networks.', icon: 'Brain', color: '#c084fc', lessons: [
    { id: 'qml-intro', moduleId: 'quantum-ml', title: 'Introduction to Quantum ML', description: 'How quantum computing intersects with machine learning.', duration: 35, difficulty: 'Advanced', objectives: ['Understand quantum advantage in ML', 'Learn quantum kernels', 'See variational classifiers'], content: [
      { heading: 'Quantum Kernels', body: 'Quantum computers can compute inner products in exponentially large feature spaces, potentially offering kernel advantages for classification tasks.' },
      { heading: 'Variational Classifiers', body: 'A parameterized quantum circuit acts as a model. Classical optimization tunes the parameters to minimize a loss function — a hybrid quantum-classical approach.' },
    ], quiz: [
      { id: 'q1', question: 'What is a quantum kernel?', options: ['A classical kernel', 'An inner product computed in quantum feature space', 'A quantum gate', 'A measurement operator'], correctIndex: 1, explanation: 'Quantum kernels compute inner products in exponentially large quantum feature spaces.' },
    ] },
  ]},
  { id: 'quantum-applications', title: 'Quantum Applications', description: 'Chemistry, optimization, finance, and cryptography use cases.', icon: 'FlaskConical', color: '#2dd4bf', lessons: [
    { id: 'quantum-chemistry', moduleId: 'quantum-applications', title: 'Quantum Chemistry Simulation', description: 'Simulating molecules with quantum computers.', duration: 30, difficulty: 'Advanced', objectives: ['Understand molecular simulation', 'See VQE for chemistry', 'Appreciate the quantum advantage'], content: [
      { heading: 'Why Quantum Chemistry?', body: 'Simulating molecules is classically intractable because the Hilbert space grows exponentially. Quantum computers naturally represent quantum systems.' },
      { heading: 'VQE for Molecules', body: 'The Variational Quantum Eigensolver finds ground state energies by combining a parameterized quantum circuit with classical optimization. It is the leading near-term application.' },
    ], quiz: [
      { id: 'q1', question: 'Why are quantum computers good for chemistry?', options: ['They are faster at everything', 'Molecules are quantum systems', 'They use less energy', 'They have more memory'], correctIndex: 1, explanation: 'Molecules are inherently quantum systems, so quantum computers can naturally simulate them.' },
    ] },
  ]},
  { id: 'research-future', title: 'Research & Future Directions', description: 'Open problems, emerging technologies, and the road ahead.', icon: 'Telescope', color: '#94a3b8', lessons: [
    { id: 'future-directions', moduleId: 'research-future', title: 'The Future of Quantum Computing', description: 'Open challenges and the path to fault-tolerant quantum computing.', duration: 20, difficulty: 'Intermediate', objectives: ['Understand current limitations', 'Know the path to fault tolerance', 'See emerging directions'], content: [
      { heading: 'The NISQ Era', body: 'We are in the Noisy Intermediate-Scale Quantum era. Current devices have 50-1000 qubits with high error rates. The challenge is finding useful applications within these constraints.' },
      { heading: 'Path to Fault Tolerance', body: 'Fault-tolerant quantum computing requires error correction overhead (1000+ physical qubits per logical qubit). The community is working toward demonstrating logical qubits with surface codes.' },
    ], quiz: [
      { id: 'q1', question: 'What does NISQ stand for?', options: ['Noisy Intermediate-Scale Quantum', 'New Integrated System Quantum', 'Near Ideal Superconducting Qubits', 'Networked Interactive State Quantum'], correctIndex: 0, explanation: 'NISQ = Noisy Intermediate-Scale Quantum, describing current-era devices.' },
    ] },
  ]},
]

export function getAllLessons(): Lesson[] { return MODULES.flatMap((m) => m.lessons) }
export function getLessonById(id: string): Lesson | undefined { return getAllLessons().find((l) => l.id === id) }
export function getModuleById(id: string): Module | undefined { return MODULES.find((m) => m.id === id) }
export function getLessonCount(): number { return getAllLessons().length }
export function getTotalDuration(): number { return getAllLessons().reduce((sum, l) => sum + l.duration, 0) }
