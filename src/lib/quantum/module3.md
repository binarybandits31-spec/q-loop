# Module 3 — Quantum Algorithms

## Textbook edition

This module presents quantum algorithms in the approved syllabus order. Each chapter preserves the detailed theory, definitions, circuits, examples, and formulas from its source chapter. It also includes key-formula derivations, one-mark questions with answers, chapter quizzes, and quiz answer keys.

## Module learning outcomes

- Explain the structure and resource model of quantum algorithms.
- Derive and trace foundational oracle-based algorithms.
- Use QFT and QPE ideas in period finding and phase estimation.
- Explain Grover search, quantum walks, and variational algorithms.
- Analyze circuits using depth, gate count, measurement statistics, and noise.

## Table of contents

- [Chapter 1: Introduction to Quantum Algorithms](#chapter-1-introduction-to-quantum-algorithms)
- [Chapter 2: Deutsch Algorithm](#chapter-2-deutsch-algorithm)
- [Chapter 3: Deutsch–Jozsa Algorithm](#chapter-3-deutsch-jozsa-algorithm)
- [Chapter 4: Bernstein–Vazirani Algorithm](#chapter-4-bernstein-vazirani-algorithm)
- [Chapter 5: Simon's Algorithm](#chapter-5-simon-s-algorithm)
- [Chapter 6: Grover's Search Algorithm](#chapter-6-grover-s-search-algorithm)
- [Chapter 7: Quantum Fourier Transform (QFT)](#chapter-7-quantum-fourier-transform-qft)
- [Chapter 8: Quantum Phase Estimation (QPE)](#chapter-8-quantum-phase-estimation-qpe)
- [Chapter 9: Shor's Algorithm](#chapter-9-shor-s-algorithm)
- [Chapter 10: Quantum Walk Algorithms](#chapter-10-quantum-walk-algorithms)
- [Chapter 11: Variational Quantum Algorithms](#chapter-11-variational-quantum-algorithms)
- [Chapter 12: Quantum Algorithm Implementation & Analysis](#chapter-12-quantum-algorithm-implementation-analysis)

---


# Chapter 1: Introduction to Quantum Algorithms {#chapter-1-introduction-to-quantum-algorithms}

## 1.1 Chapter overview

A **quantum algorithm** is a step-by-step computational procedure designed to run on a quantum computer. Like a classical algorithm, it receives an input, performs a sequence of operations, and produces an output. The difference is that a quantum algorithm uses quantum states, unitary gates, superposition, interference, entanglement, and measurement to process information.

A quantum algorithm does not automatically make every problem faster. Its advantage depends on whether the problem has a structure that can be exploited by quantum mechanics. Successful quantum algorithms carefully arrange amplitudes so that useful answers become more likely and unhelpful answers interfere destructively.

A typical quantum algorithm follows the workflow

\[
\text{initialize}
\rightarrow
\text{prepare superposition}
\rightarrow
\text{encode problem information}
\rightarrow
\text{create interference}
\rightarrow
\text{measure}
\rightarrow
\text{classically interpret the result}.
\]

Important examples include:

- **Deutsch’s algorithm**, which demonstrates a quantum query advantage for a simple function problem.
- **Deutsch–Jozsa algorithm**, which distinguishes constant and balanced functions with fewer queries than a deterministic classical procedure.
- **Bernstein–Vazirani algorithm**, which identifies a hidden bit string using one oracle query.
- **Grover’s search algorithm**, which provides a quadratic speedup for unstructured search.
- **Shor’s factoring algorithm**, which uses period finding and the quantum Fourier transform.
- **Quantum phase estimation**, which estimates eigenvalue phases of unitary operators.
- **Variational quantum algorithms**, such as VQE and QAOA, which combine quantum circuits with classical optimization.

This chapter develops the central ideas needed to understand these algorithms and explains how quantum speedup should be analyzed carefully.

---

## 1.2 Learning objectives

After studying this chapter, learners should be able to:

1. Define a quantum algorithm.
2. Distinguish a quantum algorithm from a quantum circuit.
3. Identify the common stages of a quantum algorithm.
4. Explain the roles of superposition, interference, and entanglement.
5. Understand oracle-based problem models.
6. Describe query complexity and computational complexity.
7. Distinguish exponential, polynomial, and quadratic speedups.
8. Explain why measurement is usually delayed until the end.
9. Identify major families of quantum algorithms.
10. Compare ideal quantum speedup with practical hardware performance.
11. Describe hybrid quantum-classical algorithms.
12. Analyze simple quantum-algorithm circuits.

---

# 2. What is a quantum algorithm?

## 2.1 Definition

A **quantum algorithm** is an algorithm whose computational steps are implemented using quantum operations. It acts on qubits and produces a probability distribution over classical measurement outcomes.

A quantum algorithm can be represented as

\[
\mathcal{A}=(\mathcal{I},U,\mathcal{M}),
\]

where:

- \(\mathcal{I}\) initializes the qubits.
- \(U\) is the sequence of quantum gates.
- \(\mathcal{M}\) is the measurement and classical post-processing procedure.

The algorithm starts with an input state \(|\psi_0\rangle\), applies a unitary transformation,

\[
|\psi_{\text{final}}\rangle=U|\psi_0\rangle,
\]

and then measures the final state.

## 2.2 Quantum algorithm versus quantum circuit

A **quantum circuit** is a particular arrangement of gates and measurements. A **quantum algorithm** includes the larger problem-solving procedure:

- How the input is encoded.
- Which circuit is constructed.
- How many times it is executed.
- How measurement results are processed.
- How success is verified.

A circuit is therefore one implementation component of an algorithm.

For example, a Grover algorithm includes:

1. A description of the search problem.
2. An oracle that marks the desired item.
3. A diffusion operation.
4. A choice of iteration count.
5. Measurement and result verification.

The circuit implements the oracle and diffusion steps, but the complete algorithm includes all five parts.

## 2.3 Input, computation, and output

A quantum algorithm must specify three things:

### Input

The input may be encoded as:

- A computational-basis state.
- A quantum state supplied by another process.
- Parameters in a circuit.
- An oracle describing a function.
- A Hamiltonian or matrix.

### Computation

The computation consists of quantum gates, controlled operations, oracle calls, and sometimes intermediate measurements or resets.

### Output

The output is usually a classical bit string or an estimated quantity. Since measurement is probabilistic, an algorithm may need many circuit executions.

---

# 3. Why quantum algorithms can be useful

## 3.1 Quantum resources

Quantum algorithms use several physical and mathematical resources:

### Superposition

A register can represent a combination of many computational-basis states:

\[
|\psi\rangle=\sum_x\alpha_x|x\rangle.
\]

Superposition gives an algorithm access to many amplitude components, but it does not mean that all answers can be read out simultaneously. Measurement returns only one outcome per shot.

### Interference

Interference changes amplitudes through addition and cancellation. An algorithm must arrange the phases so that desired states are amplified and undesired states are suppressed.

### Entanglement

Entanglement creates non-separable relationships between qubits. It enables joint transformations and correlations that cannot be reproduced by independent single-qubit operations.

### Quantum parallelism

Quantum parallelism refers to applying a reversible operation to a superposition of inputs:

\[
U\left(\sum_x\alpha_x|x\rangle\right)
=\sum_x\alpha_xU|x\rangle.
\]

However, quantum parallelism alone is not a speedup. The algorithm must use interference and measurement to extract useful global information.

## 3.2 The information-extraction problem

A register with \(n\) qubits has \(2^n\) basis states, but measuring it gives only one \(n\)-bit string per shot. This creates a central design challenge:

> How can an algorithm use exponentially many amplitudes while extracting only a useful amount of classical information?

Quantum algorithms solve this through structure. They do not generally reveal every amplitude. Instead, they estimate a property such as:

- Whether a function is constant or balanced.
- The location of a marked item.
- The period of a function.
- The phase of an eigenvalue.
- The ground-state energy of a Hamiltonian.
- The approximate solution to an optimization problem.

## 3.3 Problem structure and quantum advantage

Quantum advantage is problem-dependent. A quantum algorithm is useful when its circuit can exploit a structure that is difficult for the best known classical method.

Examples:

- Periodicity can be extracted with the quantum Fourier transform.
- Unstructured search can be amplified using Grover iterations.
- Quantum systems can be represented naturally for simulation.
- Eigenvalue phases can be estimated using controlled powers of a unitary.

A high qubit count alone does not establish algorithmic advantage.

---

# 4. The anatomy of a quantum algorithm

## 4.1 Initialization

Most algorithms begin with qubits in

\[
|0\rangle^{\otimes n}.
\]

Initialization may also include preparing an input basis state, a known eigenstate, a variational state, or an entangled resource state.

## 4.2 State preparation

Hadamard gates are frequently used to prepare a uniform superposition:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}|x\rangle.
\]

Other state-preparation circuits encode data or construct problem-specific trial states.

## 4.3 Oracle or problem encoding

An **oracle** is a reversible operation that encodes information about a problem. The algorithm can query the oracle but does not necessarily inspect its internal implementation.

A standard function oracle is

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

The input register stores \(x\), the output register stores \(y\), and the function value is added modulo 2.

An oracle may also mark a state by phase:

\[
O_f|x\rangle=(-1)^{f(x)}|x\rangle.
\]

When \(f(x)=1\), the phase of \(|x\rangle\) is flipped.

## 4.4 Interference stage

After encoding information, the algorithm applies gates that combine amplitudes. The purpose is to make the probability distribution informative.

For a general state,

\[
|\psi\rangle=\sum_x\alpha_x|x\rangle,
\]

an interference operator changes the amplitudes to

\[
|\psi'\rangle=V|\psi\rangle.
\]

The final probability is

\[
P(x)=|\langle x|V|\psi\rangle|^2.
\]

## 4.5 Measurement and post-processing

The final quantum state is measured. The results may be:

- A candidate answer.
- An estimate of an expectation value.
- A bit string indicating a function property.
- A phase estimate.
- A sample from a distribution.

The classical computer may repeat the circuit and calculate frequencies, averages, variances, or objective functions.

## 4.6 Verification

A practical algorithm should include a way to check the output. Verification may involve:

- Evaluating a candidate solution classically.
- Checking a parity or constraint.
- Comparing with a known small instance.
- Estimating confidence intervals.
- Repeating with different random seeds or circuit parameters.

Quantum speedup is not useful if the output cannot be verified efficiently or reliably.

---

# 5. Quantum algorithm complexity

## 5.1 Time complexity

Time complexity describes how computational resources grow with input size. In a quantum setting, the cost may include:

- Number of gates.
- Circuit depth.
- Number of oracle calls.
- Number of shots.
- Number of qubits.
- Classical post-processing time.
- Data-loading cost.

A claimed speedup must specify which resource is being compared.

## 5.2 Query complexity

Many introductory algorithms are analyzed by **query complexity**, the number of times an algorithm accesses an oracle.

For example:

- Classical unstructured search may need \(O(N)\) queries.
- Grover’s algorithm uses \(O(\sqrt N)\) queries.

This is a meaningful theoretical speedup, but total runtime also includes oracle construction, circuit execution, measurement, and verification.

## 5.3 Polynomial and exponential speedups

A polynomial speedup changes a runtime such as

\[
O(N^2)\rightarrow O(N),
\]

or

\[
O(N)\rightarrow O(\sqrt N).
\]

An exponential speedup changes a scaling relationship such as

\[
O(2^n)\rightarrow O(n^k),
\]

for some constant \(k\), under the relevant assumptions.

The speedup must be stated relative to the best known classical algorithm and the correct input model.

## 5.4 Query advantage versus practical advantage

Grover’s algorithm has a quadratic query advantage, but a practical implementation must account for:

- Oracle construction.
- Gate decomposition.
- Circuit depth.
- Number of shots.
- Hardware noise.
- Classical search baselines.

A theoretical query advantage may not immediately produce a wall-clock advantage on current hardware.

## 5.5 Complexity classes

Important complexity classes include:

- **P:** Problems solvable deterministically in polynomial time.
- **BPP:** Problems solvable by randomized classical algorithms with bounded error in polynomial time.
- **BQP:** Problems solvable by quantum algorithms in polynomial time with bounded error.
- **PSPACE:** Problems solvable using polynomial memory, possibly with exponential time.

The commonly stated containment is

\[
\mathrm{P}\subseteq\mathrm{BPP}\subseteq\mathrm{BQP}\subseteq\mathrm{PSPACE},
\]

although the strictness of several relationships is unknown.

---

# 6. Major families of quantum algorithms

## 6.1 Simulation algorithms

Quantum simulation algorithms model molecules, materials, lattice systems, and other quantum dynamics. They use the fact that quantum states can represent quantum systems naturally.

Common techniques include:

- Hamiltonian simulation.
- Trotter-Suzuki product formulas.
- Quantum phase estimation.
- Variational eigensolvers.
- Quantum imaginary-time methods.

## 6.2 Search and amplitude amplification

Grover’s algorithm searches an unstructured space in approximately

\[
O(\sqrt N)
\]

queries. Amplitude amplification generalizes this idea to improve the success probability of a quantum subroutine.

## 6.3 Fourier-transform and period-finding algorithms

The quantum Fourier transform transforms phase and periodicity information. It is used in:

- Shor’s factoring algorithm.
- Quantum phase estimation.
- Hidden-subgroup algorithms.
- Period-finding procedures.

## 6.4 Query and oracle algorithms

Oracle algorithms study how many black-box queries are needed to learn a property of a function. Examples include:

- Deutsch’s algorithm.
- Deutsch–Jozsa.
- Bernstein–Vazirani.
- Simon’s algorithm.
- Grover’s algorithm.

These algorithms are valuable because they isolate the power of quantum queries.

## 6.5 Variational and hybrid algorithms

Variational algorithms use a parameterized circuit

\[
|\psi(\boldsymbol\theta)\rangle=U(\boldsymbol\theta)|0\rangle^{\otimes n}
\]

and a classical optimizer. The quantum processor estimates a cost function, and the classical computer updates \(\boldsymbol\theta\).

A typical loop is

\[
\boldsymbol\theta
\rightarrow
\text{quantum circuit}
\rightarrow
\text{measure cost}
\rightarrow
\text{classical optimizer}
\rightarrow
\boldsymbol\theta'.
\]

Examples include VQE and QAOA.

## 6.6 Quantum machine-learning algorithms

Quantum machine-learning methods use quantum feature maps, kernels, parameterized circuits, and quantum sampling. Their practical advantage remains problem- and data-dependent.

---

# 7. Introductory example: Deutsch’s algorithm

## 7.1 Problem statement

Given a function

\[
f:\{0,1\}\rightarrow\{0,1\},
\]

the function is promised to be either:

- **Constant:** \(f(0)=f(1)\).
- **Balanced:** \(f(0)\neq f(1)\).

The goal is to determine whether \(f\) is constant or balanced.

A deterministic classical method may need two evaluations. Deutsch’s quantum algorithm needs one oracle query.

## 7.2 Oracle

The reversible oracle is

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

## 7.3 Circuit structure

Starting with \(|0\rangle|1\rangle\), apply H to both qubits:

```text
q0: ──H──────Uf────H──M──
q1: ──H──────Uf──────────
```

The second qubit becomes

\[
|-
angle=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

The oracle produces phase kickback:

\[
U_f|x\rangle|-
angle
=(-1)^{f(x)}|x\rangle|-
angle.
\]

The function value is encoded into the phase of the first-register amplitudes. The final H converts that phase information into a computational-basis result.

## 7.4 Result

The first qubit is measured as:

- 0 if the function is constant.
- 1 if the function is balanced.

The algorithm demonstrates that a quantum algorithm can use phase and interference to learn a global property of a function.

---

# 8. Introductory example: Deutsch–Jozsa algorithm

## 8.1 Problem

The Deutsch–Jozsa problem receives a function

\[
f:\{0,1\}^n\rightarrow\{0,1\}
\]

with the promise that it is either:

- Constant: the same output for every input.
- Balanced: 0 for exactly half the inputs and 1 for the other half.

## 8.2 Query complexity

A deterministic classical algorithm may require

\[
2^{n-1}+1
\]

queries in the worst case. The quantum algorithm uses one oracle query.

## 8.3 Circuit idea

The algorithm:

1. Initializes an input register and one ancilla.
2. Applies H to all qubits.
3. Applies the oracle once.
4. Applies H to the input register.
5. Measures the input register.

The measurement result is:

- \(|0\cdots0\rangle\) for a constant function.
- Any nonzero string for a balanced function in the ideal promised setting.

## 8.4 Lesson

Deutsch–Jozsa is mainly a demonstration of query complexity and interference. It is not automatically a practical speedup for every real-world problem.

---

# 9. Introductory example: Grover’s algorithm

## 9.1 Search problem

Suppose one marked item exists in an unstructured database of \(N\) possibilities. A classical search requires an average of about \(N/2\) queries. Grover’s algorithm requires approximately

\[
\frac{\pi}{4}\sqrt N
\]

iterations.

## 9.2 Oracle

The oracle marks the desired state by a phase flip:

\[
O|x\rangle=
\begin{cases}
-|x\rangle,&x=x^*,\\
|x\rangle,&x\neq x^*.
\end{cases}
\]

## 9.3 Diffusion operator

The diffusion operator reflects amplitudes around their average. It can be written as

\[
D=2|s\rangle\langle s|-I,
\]

where \(|s\rangle\) is the uniform superposition.

One Grover iteration is

\[
G=DO.
\]

Repeated applications rotate the state toward the marked item.

## 9.4 Approximate iteration count

The optimal number of iterations is approximately

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

Too few iterations do not amplify the marked state enough. Too many iterations can rotate past the maximum success probability.

## 9.5 Practical limitations

Grover’s speedup is quadratic, not exponential. The oracle must be implemented, and the number of gates inside the oracle may dominate the total cost. Noise also limits the useful number of iterations.

---

# 10. Introductory example: Shor’s algorithm

## 10.1 Factoring problem

Given a composite integer \(N\), Shor’s algorithm finds its nontrivial factors in expected polynomial time under standard assumptions.

Factoring is important because widely used public-key cryptosystems rely on the difficulty of factoring large integers.

## 10.2 Period finding

Shor’s algorithm reduces factoring to finding the period \(r\) of

\[
f(x)=a^x\bmod N,
\]

where \(a\) is chosen relatively prime to \(N\).

The period satisfies

\[
a^r\equiv1\pmod N.
\]

## 10.3 Quantum subroutine

The quantum part prepares a superposition of inputs, computes modular exponentiation coherently, and applies the quantum Fourier transform. Measurement provides information about the period.

A classical continued-fraction procedure then uses the measured information to estimate \(r\). The complete algorithm is hybrid: quantum period estimation is combined with classical arithmetic and number theory.

## 10.4 Lesson

Shor’s algorithm demonstrates how a quantum Fourier transform can reveal periodic structure. It also shows that a quantum algorithm may contain substantial classical processing around a quantum subroutine.

---

# 11. Quantum phase estimation

## 11.1 Problem

Given a unitary operator \(U\) and an eigenstate \(|\psi\rangle\) such that

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle,
\]

the goal is to estimate the phase \(\phi\).

## 11.2 Circuit structure

Quantum phase estimation uses:

1. A counting register initialized in \(|0\rangle^{\otimes t}\).
2. Hadamard gates on the counting register.
3. Controlled powers \(U^{2^k}\).
4. An inverse quantum Fourier transform.
5. Measurement of the counting register.

The measured bit string approximates the binary expansion of \(\phi\).

## 11.3 Importance

Phase estimation is a subroutine for:

- Shor’s algorithm.
- Hamiltonian eigenvalue estimation.
- Quantum simulation.
- Energy estimation.
- Quantum walks.

It illustrates the use of controlled operations, phase kickback, and the quantum Fourier transform.

---

# 12. Variational quantum algorithms

## 12.1 Hybrid structure

A variational algorithm uses a parameterized quantum circuit and a classical optimization loop:

\[
|\psi(\boldsymbol\theta)\rangle
=U(\boldsymbol\theta)|0\rangle^{\otimes n}.
\]

The quantum processor estimates an objective such as

\[
C(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle.
\]

The classical optimizer updates parameters to minimize or maximize the objective.

## 12.2 VQE

The **variational quantum eigensolver** estimates the ground-state energy of a Hamiltonian \(H\). The variational principle gives

\[
E(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle
\ge E_0,
\]

where \(E_0\) is the true ground-state energy.

The algorithm searches for parameters that make \(E(\boldsymbol\theta)\) as small as possible.

## 12.3 QAOA

The **quantum approximate optimization algorithm** uses alternating problem and mixer operators:

\[
|\boldsymbol\gamma,\boldsymbol\beta\rangle
=\prod_{p}e^{-i\beta_pB}e^{-i\gamma_pC}|+\rangle^{\otimes n}.
\]

The parameters are optimized to increase the expected value of a cost function. QAOA is designed for combinatorial optimization and is a hybrid quantum-classical algorithm.

## 12.4 Challenges

Variational algorithms face:

- Barren plateaus.
- Sampling noise.
- Classical optimizer instability.
- Expressibility versus trainability trade-offs.
- Circuit-depth limitations.
- Measurement overhead.
- Hardware noise.

---

# 13. The role of measurement and probability

## 13.1 One run is one sample

A quantum algorithm does not normally return a complete probability distribution from one circuit execution. One shot produces one classical output.

If the desired outcome has probability \(p\), then after \(N\) independent shots the expected count is

\[
Np.
\]

The standard deviation of the count is approximately

\[
\sqrt{Np(1-p)}.
\]

## 13.2 Success probability

If one run succeeds with probability \(p\), the probability of at least one success in \(N\) independent runs is

\[
P(\text{at least one success})=1-(1-p)^N.
\]

This formula is useful when an algorithm produces a candidate solution that can be classically verified.

## 13.3 Expectation values

Many algorithms estimate an expectation value

\[
\langle O\rangle
=\langle\psi|O|\psi\rangle.
\]

The observable \(O\) may be decomposed into Pauli operators:

\[
H=\sum_jc_jP_j.
\]

Then

\[
\langle H\rangle=\sum_jc_j\langle P_j\rangle.
\]

Each term may require separate measurement settings and many shots.

## 13.4 Confidence and error

Measured frequencies are estimates. A responsible quantum algorithm report should include:

- Number of shots.
- Estimated probabilities or expectation values.
- Statistical uncertainty.
- Hardware or noise conditions.
- Verification method.

---

# 14. Quantum algorithms on real hardware

## 14.1 Ideal versus practical algorithms

An ideal algorithm assumes exact gates, perfect state preparation, and perfect measurement. A real implementation faces:

- Gate errors.
- Decoherence.
- Readout errors.
- Limited connectivity.
- Compiler overhead.
- Queue and calibration changes.
- Finite shot budgets.

The practical algorithm must be adapted to the platform.

## 14.2 Circuit depth and noise

A useful approximation is that deeper circuits accumulate more error. If an algorithm requires many oracle iterations, Fourier-transform layers, or variational repetitions, the output distribution can become unreliable.

Algorithm designers therefore optimize:

- Gate count.
- Two-qubit gate count.
- Circuit depth.
- Number of measurement settings.
- Number of shots.
- Qubit mapping.

## 14.3 Classical baselines

Every claimed quantum advantage should be compared with a strong classical baseline. The comparison should use:

- The same problem instance.
- The same input-access assumptions.
- The same output-quality requirement.
- The total runtime or resource cost.
- The cost of data loading and post-processing.

A quantum circuit that is faster than a weak classical implementation does not establish quantum advantage.

## 14.4 Verification and validation

Useful validation strategies include:

- Compare small instances against exact classical solutions.
- Simulate the ideal circuit.
- Run a noisy simulation.
- Execute on hardware.
- Repeat experiments with different shot counts.
- Check known symmetries and conservation laws.
- Measure error rates and correlations.

---

# 15. Common misconceptions

## Misconception 1: Quantum algorithms try every answer and read them all

A superposition contains many amplitudes, but measurement returns limited classical information. Interference is required to make useful answers more likely.

## Misconception 2: Quantum computers make every algorithm faster

Speedup is problem-dependent. Some problems have no known quantum advantage.

## Misconception 3: Exponential state-space size automatically gives exponential speedup

A quantum state may have exponentially many amplitudes, but extracting useful information and implementing the circuit can be difficult.

## Misconception 4: One successful shot proves an algorithm works

A result must be statistically analyzed and compared against expected probabilities and classical baselines.

## Misconception 5: An oracle is free in practice

Oracle query complexity treats the oracle as a black box, but building and decomposing the oracle may be the dominant practical cost.

## Misconception 6: Entanglement alone guarantees speedup

Entanglement is a resource, not a universal guarantee of computational advantage. The entire algorithm and problem structure matter.

## Misconception 7: A quantum algorithm must be entirely quantum

Many important algorithms use classical input preparation, optimization, arithmetic, verification, and post-processing.

## Misconception 8: Variational algorithms always work on NISQ hardware

They are designed for near-term systems but still face noise, measurement overhead, barren plateaus, and optimization difficulties.

---

# 16. Chapter summary

A quantum algorithm is a problem-solving procedure that uses quantum states and operations before producing a classical result. A quantum circuit is one component of the complete algorithm.

The common structure is

\[
\text{initialize}
\rightarrow
\text{prepare}
\rightarrow
\text{encode}
\rightarrow
\text{interfere}
\rightarrow
\text{measure}
\rightarrow
\text{post-process}.
\]

Superposition provides a space of amplitudes, entanglement creates joint quantum relationships, and interference shapes the probability distribution. Quantum parallelism alone does not provide a speedup because measurement reveals only limited classical information.

Quantum algorithms are analyzed using resources such as gate count, circuit depth, qubit count, oracle queries, shots, and classical post-processing. Examples of algorithmic speedups include Grover’s quadratic search speedup and Shor’s polynomial-time factoring algorithm under its computational assumptions.

Major algorithm families include oracle algorithms, search and amplitude amplification, Fourier-transform and period-finding methods, quantum simulation, phase estimation, and variational hybrid algorithms.

A practical quantum algorithm must be tested with ideal simulation, noisy simulation, and hardware execution when possible. It must be compared against a strong classical baseline and evaluated with statistical and hardware-aware discipline.

---

# 17. Formula sheet

Quantum algorithm state evolution:

\[
|\psi_{\text{final}}\rangle=U|\psi_0\rangle.
\]

Uniform superposition:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}\sum_x|x\rangle.
\]

Function oracle:

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

Phase oracle:

\[
O_f|x\rangle=(-1)^{f(x)}|x\rangle.
\]

Measurement probability:

\[
P(x)=|\langle x|\psi\rangle|^2.
\]

Grover iteration estimate:

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

Phase estimation eigenvalue relation:

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle.
\]

Variational state:

\[
|\psi(\boldsymbol\theta)\rangle=U(\boldsymbol\theta)|0\rangle^{\otimes n}.
\]

VQE energy:

\[
E(\boldsymbol\theta)=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle\ge E_0.
\]

Expectation value:

\[
\langle O\rangle=\langle\psi|O|\psi\rangle.
\]

Shot-count deviation:

\[
\sigma_N=\sqrt{Np(1-p)}.
\]

At-least-one-success probability:

\[
P(\text{success at least once})=1-(1-p)^N.
\]

---

# 18. Review questions and exercises

## Conceptual questions

1. What is a quantum algorithm?
2. How is a quantum algorithm different from a quantum circuit?
3. What are the typical stages of a quantum algorithm?
4. Why is superposition alone not enough to produce a speedup?
5. What role does interference play?
6. What is an oracle?
7. What is query complexity?
8. What is the difference between a quadratic and exponential speedup?
9. What does Grover’s algorithm search for?
10. What problem does Shor’s algorithm address?
11. What does quantum phase estimation estimate?
12. What is a variational quantum algorithm?
13. Why are many quantum algorithms hybrid?
14. Why must quantum algorithms be compared with classical baselines?

## Numerical exercises

1. Calculate the number of basis states in a 5-qubit register.
2. Calculate the probability of outcome 101 from a state whose amplitude for 101 is \(1/2\).
3. Estimate the number of Grover iterations for \(N=256\).
4. Calculate the expected count and standard deviation for an outcome with probability \(p=0.25\) in 1,000 shots.
5. Calculate the probability of at least one success if a single run succeeds with probability 0.1 and the circuit is run 20 times.
6. Write the oracle transformation \(U_f|x\rangle|y\rangle\) for a simple Boolean function.
7. Explain why one oracle query is sufficient for Deutsch–Jozsa in the promised problem.
8. Calculate the VQE energy expression for a Hamiltonian \(H=c_0I+c_1Z\).
9. Estimate the simplified success probability \((1-p)^G\) for \(p=0.005\) and \(G=100\).
10. Explain how increasing circuit depth affects a NISQ algorithm.

## Circuit exercises

Draw and analyze circuits for:

1. Preparing a uniform superposition on two qubits.
2. Creating phase kickback with an oracle.
3. A one-qubit Deutsch algorithm.
4. A two-qubit Grover search.
5. The H+CNOT Bell-state preparation used in algorithmic subroutines.
6. A simple phase-estimation circuit with one counting qubit.
7. A parameterized circuit for a variational algorithm.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement Deutsch’s algorithm for all four one-bit Boolean functions.
2. Implement the Deutsch–Jozsa algorithm for small input sizes.
3. Implement Grover’s algorithm for a two- or three-qubit search space.
4. Prepare and measure a Bell state as an entanglement subroutine.
5. Implement a small phase-estimation circuit.
6. Build a parameterized circuit and evaluate an expectation value.
7. Compare ideal and noisy results.
8. Record gate count, circuit depth, number of shots, and success probability.
9. Compare the quantum circuit with a classical baseline.

---

# 19. Glossary

**Amplitude amplification:** A family of techniques that increases the probability of desired quantum states.

**Classical post-processing:** Computation performed on measurement results by a classical computer.

**Quantum algorithm:** A problem-solving procedure implemented using quantum states and operations.

**Quantum Fourier transform:** A quantum transformation that reveals phase and periodicity information.

**Oracle:** A reversible operation that encodes information about a problem or function.

**Query complexity:** The number of oracle calls made by an algorithm.

**Variational algorithm:** A hybrid algorithm that optimizes parameters of a quantum circuit using a classical computer.

**Phase estimation:** An algorithmic method for estimating the phase of a unitary eigenvalue.

**Speedup:** Improvement in computational-resource scaling relative to a classical method.

**Success probability:** The probability that one circuit execution produces an acceptable answer.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[4]: https://doi.org/10.1103/PhysRevLett.79.325 "A fast quantum mechanical algorithm for database search"

[5]: https://doi.org/10.1109/SFCS.1994.365700 "Algorithms for quantum computation: discrete logarithms and factoring"

[6]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

[7]: https://www.nist.gov/quantum-information-science "National Institute of Standards and Technology: Quantum Information Science"

## Key formulas: derivation and interpretation

### Query complexity

\[
Q_A(f)=\text{number of oracle queries made by algorithm }A.
\]

**Derivation:** In an oracle model, the input function is accessed only through a black-box query. Counting those calls gives query complexity. This isolates the information-gathering cost from other gates and classical processing.

### General quantum state

\[
|\psi\rangle=\sum_x\alpha_x|x\rangle,
\qquad \sum_x|\alpha_x|^2=1.
\]

The basis states \(|x\rangle\) are possible computational inputs, \(\alpha_x\) are amplitudes, and normalization follows because the probabilities \(|\alpha_x|^2\) must sum to one. Quantum speedup comes from transforming these amplitudes with interference; superposition alone does not guarantee speedup.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is a quantum algorithm?
   **Answer:** A procedure that uses quantum states, gates, measurement, and quantum effects to solve a computational problem.

2. **Question:** What is query complexity?
   **Answer:** The number of oracle or black-box queries made by an algorithm.

3. **Question:** Name three quantum resources.
   **Answer:** Superposition, interference, and entanglement.

4. **Question:** What is an oracle?
   **Answer:** A black-box operation that encodes a problem-dependent function.

5. **Question:** What is quantum speedup?
   **Answer:** An improvement in resource use compared with a specified classical method.

### Chapter quiz

1. What is a quantum algorithm?

2. What is query complexity?

3. Name three quantum resources.

4. What is an oracle?

5. What is quantum speedup?

### Quiz answer key

1. **A procedure that uses quantum states, gates, measurement, and quantum effects to solve a computational problem.**

2. **The number of oracle or black-box queries made by an algorithm.**

3. **Superposition, interference, and entanglement.**

4. **A black-box operation that encodes a problem-dependent function.**

5. **An improvement in resource use compared with a specified classical method.**


---


# Chapter 2: Deutsch Algorithm {#chapter-2-deutsch-algorithm}

## 2.1 Chapter overview

Deutsch’s algorithm is one of the simplest quantum algorithms and one of the most important conceptually. It demonstrates how a quantum computer can determine a global property of a function using fewer oracle queries than a deterministic classical computer.

The problem is small, but the ideas are fundamental:

- Oracle access to a function.
- Reversible computation.
- Ancilla qubits.
- Superposition of queries.
- Phase kickback.
- Interference.
- Measurement of a function property rather than a function value.

Given a Boolean function

\[
f:\{0,1\}\rightarrow\{0,1\},
\]

we are promised that the function is either:

- **Constant:** \(f(0)=f(1)\).
- **Balanced:** \(f(0)\neq f(1)\).

The goal is to determine whether \(f\) is constant or balanced.

A deterministic classical algorithm may need to evaluate the function twice. Deutsch’s algorithm evaluates the oracle once and determines the answer with certainty in the ideal model.

The standard circuit is

```text
q0: ──H──────Uf────H────M──
q1: ──H──────Uf────────────
```

The second qubit is prepared in \(|-\rangle\). The oracle does not need to reveal the function value directly. Instead, it encodes the function into the phase of the first qubit through phase kickback. A final Hadamard gate converts this phase information into a computational-basis measurement.

---

## 2.2 Learning objectives

After studying this chapter, learners should be able to:

1. State the Deutsch problem.
2. Define constant and balanced Boolean functions.
3. Explain why a classical deterministic method may require two queries.
4. Construct a reversible oracle.
5. Explain the role of the ancilla qubit.
6. Derive phase kickback using the \(|-\rangle\) state.
7. Follow every state transformation in Deutsch’s circuit.
8. Predict the final measurement for all four Boolean functions.
9. Explain the one-query advantage.
10. Distinguish deterministic success from bounded-error success.
11. Implement Deutsch’s algorithm in a quantum SDK.
12. Understand the relationship between Deutsch’s and Deutsch–Jozsa algorithms.

## 2.3 Key definitions

### Boolean function

A **Boolean function** is a function whose inputs and outputs are bits. In Deutsch’s problem,

\[
f:\{0,1\}\rightarrow\{0,1\}.
\]

The input can be 0 or 1, and the output can also be 0 or 1.

### Constant function

A **constant function** gives the same output for every allowed input. For a one-bit function,

\[
f(0)=f(1).
\]

The two constant functions are

\[
f(x)=0
\]

and

\[
f(x)=1.
\]

### Balanced function

A **balanced function** gives different outputs for the two possible inputs:

\[
f(0)\neq f(1).
\]

The two balanced one-bit functions are

\[
f(x)=x
\]

and

\[
f(x)=1\oplus x.
\]

### Oracle

An **oracle** is a black-box operation that provides information about a function or problem instance. In a quantum algorithm, the oracle must be represented by a reversible unitary operation. Deutsch’s oracle is

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

The oracle is called a black box because the algorithm uses its input-output behavior without needing to inspect the internal implementation.

### Query

A **query** is one application of the oracle. Query complexity counts how many times an algorithm accesses the problem oracle. Deutsch’s algorithm uses one quantum query, while a deterministic classical algorithm needs two queries in the worst case.

### Ancilla qubit

An **ancilla qubit** is an additional working qubit used to make an operation reversible or to support an intermediate computation. In Deutsch’s algorithm, the ancilla is initialized in \(|1\rangle\), transformed into \(|-\rangle\), and enables phase kickback.

### Phase

The **phase** of a quantum amplitude is the angle associated with its complex value. A relative phase between two components can affect interference and later measurement probabilities.

For example,

\[
|+\rangle=\frac{|0\rangle+|1\rangle}{\sqrt2}
\]

and

\[
|-\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2}
\]

have the same computational-basis probabilities but different relative phases.

### Global phase

A **global phase** multiplies the entire state by the same complex factor:

\[
|\psi\rangle\mapsto e^{i\theta}|\psi\rangle.
\]

Global phase does not change measurement probabilities. For this reason, \(|\psi\rangle\) and \(-|\psi\rangle\) are physically indistinguishable in a direct measurement.

### Relative phase

A **relative phase** is a phase difference between components of a superposition. Unlike a global phase, it can affect interference. The states \(|+\rangle\) and \(|-\rangle\) differ by a relative phase of \(\pi\), which is why a later Hadamard gate maps them to different basis states.

### Phase kickback

**Phase kickback** is the process by which a controlled operation transfers information about the target operation into the phase of a control branch or input state. In Deutsch’s algorithm,

\[
U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
\]

The target remains \(|-\rangle\), while the function value appears as a phase on \(|x\rangle\).

### Interference

**Interference** is the combination of probability amplitudes. Amplitudes with matching phase can reinforce one another, while amplitudes with opposing phase can cancel. Deutsch’s final Hadamard gate uses interference to turn the function’s phase pattern into a measurable 0 or 1.

### Quantum query complexity

**Quantum query complexity** is the number of oracle calls made by a quantum algorithm. For Deutsch’s problem,

\[
Q(f)=1.
\]

This is compared with the deterministic classical query complexity

\[
D(f)=2.
\]

The comparison is made in the oracle model and does not automatically represent total hardware runtime.

---

# 3. The Deutsch problem

## 3.1 Boolean function

A Boolean function maps a bit to a bit:

\[
f:\{0,1\}\rightarrow\{0,1\}.
\]

There are four possible functions:

| Function | \(f(0)\) | \(f(1)\) | Type |
|---|---:|---:|---|
| \(f_0(x)=0\) | 0 | 0 | Constant |
| \(f_1(x)=1\) | 1 | 1 | Constant |
| \(f_2(x)=x\) | 0 | 1 | Balanced |
| \(f_3(x)=1\oplus x\) | 1 | 0 | Balanced |

A function is constant when it has the same value for both inputs. It is balanced when it outputs 0 once and 1 once.

## 3.2 The computational task

The task is not to find \(f(0)\) or \(f(1)\) individually. It is to determine the property

\[
f(0)\oplus f(1).
\]

If

\[
f(0)\oplus f(1)=0,
\]

then the function is constant. If

\[
f(0)\oplus f(1)=1,
\]

then the function is balanced.

## 3.3 Classical deterministic solution

A deterministic classical algorithm can query the function at \(x=0\) and \(x=1\):

1. Calculate \(f(0)\).
2. Calculate \(f(1)\).
3. Compare the values.

The query complexity is

\[
D(f)=2
\]

in the worst case.

One query is not enough for a deterministic classical algorithm. If the first query returns 0, the function could be either:

- Constant zero, with \(f(1)=0\).
- Balanced identity, with \(f(1)=1\).

The same first answer is compatible with two different promised functions.

## 3.4 Quantum solution

Deutsch’s algorithm uses one oracle query. It does not evaluate both inputs as separate classical cases. Instead, it prepares a superposition of the two inputs and uses interference to extract the relationship between \(f(0)\) and \(f(1)\).

---

# 4. The reversible oracle

## 4.1 Why the oracle needs two qubits

A classical function may map both inputs to the same output. For example,

\[
f(0)=f(1)=0.
\]

A direct transformation \(|x\rangle\mapsto|f(x)\rangle\) would not be reversible because different inputs could produce the same output.

Quantum gates must be reversible. Therefore, the function is embedded into a two-register oracle:

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

The input \(x\) is preserved, and the function value is added modulo 2 to the target bit \(y\).

## 4.2 Oracle basis-state action

For each input \(x\),

\[
U_f|x\rangle|0\rangle=|x\rangle|f(x)\rangle.
\]

If the target begins in \(|0\rangle\), the oracle writes the function output into the target. If the target begins in \(|1\rangle\), the output is XORed with 1.

## 4.3 Oracle unitarity

The transformation is reversible because applying the same XOR operation twice restores the original target:

\[
(y\oplus f(x))\oplus f(x)=y.
\]

Therefore,

\[
U_f^2=I,
\]

for the standard Boolean oracle.

## 4.4 Oracles for the four functions

### Constant-zero function

For \(f(x)=0\),

\[
U_f|x\rangle|y\rangle=|x\rangle|y\rangle.
\]

The oracle is the identity operation.

### Constant-one function

For \(f(x)=1\), the target is flipped regardless of \(x\). The oracle is an X gate on the target:

\[
U_f=I\otimes X.
\]

### Identity function

For \(f(x)=x\), the oracle is CNOT with the input as control and the target as target:

\[
U_f=\operatorname{CNOT}.
\]

### Negated identity function

For \(f(x)=1\oplus x\), the target is flipped when \(x=0\) and unchanged when \(x=1\). It can be implemented using X gates around the control and a CNOT:

\[
U_f=(X\otimes I)\operatorname{CNOT}(X\otimes I),
\]

up to the convention for wire ordering.

---

# 5. The phase-kickback mechanism

## 5.1 The \(|-\rangle\) state

The Hadamard gate transforms \(|1\rangle\) into

\[
H|1\rangle
=\frac{|0\rangle-|1\rangle}{\sqrt2}
=|-\rangle.
\]

The state \(|-\rangle\) is an eigenstate of X:

\[
X|-\rangle=-|-\rangle.
\]

This phase property is the key to Deutsch’s algorithm.

## 5.2 Oracle acting on \(|-\rangle\)

Consider the oracle acting on \(|x\rangle|-\rangle\):

\[
U_f|x\rangle|-\rangle.
\]

Since the oracle applies X to the target when \(f(x)=1\), and since

\[
X|-\rangle=-|-\rangle,
\]

we obtain

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

The target returns to the same state, while the function value appears as a phase on the input branch.

## 5.3 Derivation

Write

\[
|-\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

Then

\[
U_f|x\rangle|-\rangle
=\frac{1}{\sqrt2}
\left(U_f|x\rangle|0\rangle-U_f|x\rangle|1\rangle\right).
\]

Using the oracle definition,

\[
U_f|x\rangle|0\rangle=|x\rangle|f(x)\rangle,
\]

and

\[
U_f|x\rangle|1\rangle=|x\rangle|1\oplus f(x)\rangle.
\]

If \(f(x)=0\), the expression remains \(|x\rangle|-\rangle\). If \(f(x)=1\), the target basis states are exchanged and the expression becomes \(-|x\rangle|-\rangle\). Therefore,

\[
U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
\]

## 5.4 Why phase kickback is useful

The oracle does not need to store the function value in a measured output bit. It changes the relative phase between the \(|0\rangle\) and \(|1\rangle\) branches of the input qubit.

A final Hadamard gate turns that relative phase into an amplitude difference that can be measured.

---

# 6. Deutsch’s algorithm circuit

## 6.1 Circuit diagram

The standard circuit is

```text
q0: ──H──────Uf────H────M──
q1: ──X──H───Uf────────────
```

The lower wire begins in \(|0\rangle\), receives X to become \(|1\rangle\), and then receives H to become \(|-\rangle\). An equivalent initialization description is to start with \(|0\rangle|1\rangle\) and apply H to both qubits.

## 6.2 Initial state

The algorithm begins with

\[
|\psi_0\rangle=|0\rangle|1\rangle.
\]

Applying H to both qubits gives

\[
|\psi_1\rangle
=H|0\rangle\otimes H|1\rangle.
\]

Therefore,

\[
|\psi_1\rangle
=\frac{|0\rangle+|1\rangle}{\sqrt2}
\otimes
\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

Using \(|+\rangle=(|0\rangle+|1\rangle)/\sqrt2\),

\[
|\psi_1\rangle=|+\rangle|-\rangle.
\]

## 6.3 Oracle stage

Apply \(U_f\):

\[
U_f|+\rangle|-\rangle
=\frac{(-1)^{f(0)}|0\rangle+(-1)^{f(1)}|1\rangle}{\sqrt2}|-\rangle.
\]

The function has been encoded as a relative phase in the first qubit.

## 6.4 Final Hadamard

The first qubit is now one of four phase states:

\[
\frac{|0\rangle+|1\rangle}{\sqrt2}=|+\rangle,
\]

\[
\frac{|0\rangle-|1\rangle}{\sqrt2}=|-\rangle,
\]

\[
\frac{-|0\rangle+|1\rangle}{\sqrt2}=-|-\rangle,
\]

or

\[
\frac{-|0\rangle-|1\rangle}{\sqrt2}=-|+\rangle.
\]

The final H maps

\[
H|+\rangle=|0\rangle,
\qquad
H|-\rangle=|1\rangle.
\]

Global minus signs do not affect measurement, so constant functions result in 0 and balanced functions result in 1.

---

# 7. Full state derivation

## 7.1 After initialization

The initial state is

\[
|\psi_0\rangle=|0\rangle|1\rangle.
\]

After H gates,

\[
|\psi_1\rangle
=\frac{|0\rangle+|1\rangle}{\sqrt2}
\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

Expanding,

\[
|\psi_1\rangle
=\frac{|00\rangle-|01\rangle+|10\rangle-|11\rangle}{2}.
\]

## 7.2 After the oracle

Using phase kickback,

\[
|\psi_2\rangle
=\frac{(-1)^{f(0)}|0\rangle+(-1)^{f(1)}|1\rangle}{\sqrt2}|-\rangle.
\]

The target remains \(|-\rangle\), while the first qubit contains the function-property information.

## 7.3 After the final H

Applying H to the first qubit gives

\[
H\left[
\frac{(-1)^{f(0)}|0\rangle+(-1)^{f(1)}|1\rangle}{\sqrt2}
\right].
\]

Using

\[
H|0\rangle=\frac{|0\rangle+|1\rangle}{\sqrt2},
\]

and

\[
H|1\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2},
\]

we obtain

\[
\frac12\left[
\left((-1)^{f(0)}+(-1)^{f(1)}\right)|0\rangle
+\left((-1)^{f(0)}-(-1)^{f(1)}\right)|1\rangle
\right].
\]

The amplitude of \(|0\rangle\) is nonzero for constant functions, and the amplitude of \(|1\rangle\) is nonzero for balanced functions.

## 7.4 Compact result

The first-qubit measurement result \(z\) satisfies

\[
z=f(0)\oplus f(1).
\]

Therefore,

\[
z=0\Rightarrow f\text{ is constant},
\]

\[
z=1\Rightarrow f\text{ is balanced}.
\]

The ideal algorithm succeeds with probability 1.

---

# 8. The four cases

## 8.1 Constant-zero function

Let

\[
f(x)=0.
\]

The oracle is the identity. After the initial H gates, the first qubit is \(|+\rangle\). The oracle leaves it unchanged, and the final H produces

\[
H|+\rangle=|0\rangle.
\]

Measurement returns 0.

## 8.2 Constant-one function

Let

\[
f(x)=1.
\]

The oracle applies X to the target for both input branches. Since the target is \(|-\rangle\), both branches receive a global minus sign:

\[
|+\rangle|-\rangle
\mapsto
-|+\rangle|-\rangle.
\]

The global minus sign has no measurement effect. The final H still produces 0.

## 8.3 Identity function

Let

\[
f(x)=x.
\]

The oracle applies a phase of +1 to the \(|0\rangle\) branch and -1 to the \(|1\rangle\) branch:

\[
|+\rangle\mapsto|-\rangle.
\]

The final H produces

\[
H|-\rangle=|1\rangle.
\]

Measurement returns 1.

## 8.4 Negated identity function

Let

\[
f(x)=1\oplus x.
\]

The phase pattern is -1 on the \(|0\rangle\) branch and +1 on the \(|1\rangle\) branch. The first qubit becomes \(-|-\rangle\), and the final H produces \(-|1\rangle\). The global sign is irrelevant, so measurement returns 1.

## 8.5 Summary table

| Function | \(f(0)\) | \(f(1)\) | Type | Final first-qubit result |
|---|---:|---:|---|---:|
| \(f(x)=0\) | 0 | 0 | Constant | 0 |
| \(f(x)=1\) | 1 | 1 | Constant | 0 |
| \(f(x)=x\) | 0 | 1 | Balanced | 1 |
| \(f(x)=1\oplus x\) | 1 | 0 | Balanced | 1 |

---

# 9. Query complexity and speedup

## 9.1 Classical query complexity

A deterministic classical algorithm needs two function evaluations in the worst case:

\[
D(f)=2.
\]

A randomized classical algorithm can sometimes succeed with one query, but it cannot guarantee the correct answer with certainty for all four promised functions.

## 9.2 Quantum query complexity

Deutsch’s algorithm uses one oracle call:

\[
Q(f)=1.
\]

The quantum query advantage is

\[
D(f)=2,
\qquad
Q(f)=1.
\]

This is a small but exact separation in the oracle-query model.

## 9.3 What the result does and does not prove

Deutsch’s algorithm demonstrates:

- Quantum queries can process a superposition of inputs.
- Phase kickback can encode function information.
- Interference can reveal a global property.
- Quantum query complexity can differ from deterministic classical query complexity.

It does not prove that quantum computers are twice as fast for every practical implementation. The oracle must be built, and physical gate costs may differ.

## 9.4 Generalization to Deutsch–Jozsa

Deutsch’s problem is the one-bit case of the Deutsch–Jozsa problem. Deutsch–Jozsa considers

\[
f:\{0,1\}^n\rightarrow\{0,1\}
\]

with a promise that the function is constant or balanced. The same phase-kickback and interference ideas extend to an \(n\)-qubit input register.

---

# 10. Circuit implementation

## 10.1 High-level pseudocode

```text
function Deutsch(f):
    create q_input in |0⟩
    create q_ancilla in |1⟩
    apply H to q_input
    apply H to q_ancilla
    apply oracle Uf
    apply H to q_input
    measure q_input
    if result == 0:
        return "constant"
    else:
        return "balanced"
```

## 10.2 Oracle implementation pseudocode

For the four one-bit functions:

```text
f(x) = 0:
    do nothing

f(x) = 1:
    apply X to the ancilla

f(x) = x:
    apply CNOT(input, ancilla)

f(x) = 1 XOR x:
    apply X to input
    apply CNOT(input, ancilla)
    apply X to input
```

The last construction may be represented in equivalent ways depending on the chosen circuit convention.

## 10.3 Ideal simulator workflow

1. Create a two-qubit circuit.
2. Prepare the input qubit in \(|+\rangle\).
3. Prepare the ancilla in \(|-\rangle\).
4. Insert the selected oracle.
5. Apply H to the input qubit.
6. Measure the input qubit.
7. Run several shots and inspect the counts.

The ideal output should be deterministic:

```text
constant oracle: 0 appears with probability 1
balanced oracle: 1 appears with probability 1
```

## 10.4 Hardware considerations

On real hardware, small error counts may appear in the wrong result. Sources include:

- Imperfect H gates.
- Imperfect CNOT gates.
- Ancilla preparation errors.
- Readout errors.
- Decoherence.
- Oracle decomposition errors.

For an introductory two-qubit algorithm, error mitigation may not be necessary, but the experiment should report the backend and shot count.

---

# 11. Worked examples

## Example 2.1: Classifying a function from its table

Suppose the oracle table is

\[
f(0)=1,
\qquad
f(1)=0.
\]

The outputs differ, so the function is balanced. Deutsch’s algorithm returns

\[
f(0)\oplus f(1)=1\oplus0=1.
\]

The first-qubit measurement is 1.

## Example 2.2: Tracking the constant-zero oracle

Start with

\[
|0\rangle|1\rangle.
\]

After H gates,

\[
|+\rangle|-\rangle.
\]

The constant-zero oracle is identity, so the state remains

\[
|+\rangle|-\rangle.
\]

The final H changes \(|+\rangle\) to \(|0\rangle\). The output is constant.

## Example 2.3: Tracking the identity oracle

For \(f(x)=x\), the oracle is CNOT. The state before the oracle is

\[
|+\rangle|-\rangle
=\frac{|0\rangle+|1\rangle}{\sqrt2}|-\rangle.
\]

The control-0 branch receives no target flip. The control-1 branch applies X to \(|-\rangle\), producing a minus sign:

\[
\frac{|0\rangle|-\rangle-|1\rangle|-\rangle}{\sqrt2}
=|-\rangle|-\rangle.
\]

The final H maps the input to \(|1\rangle\). The output is balanced.

## Example 2.4: Measurement counts

Suppose the balanced oracle is run for 1,000 shots and returns

```text
0 : 8
1 : 992
```

The estimated probability of the expected output 1 is

\[
\hat P(1)=\frac{992}{1000}=0.992.
\]

The eight incorrect results may be caused by noise or readout error.

## Example 2.5: Global phase

For the constant-one function, the full state may become

\[
-|+\rangle|-\rangle
\]

instead of \(|+\rangle|-\rangle\). The global minus sign does not change any measurement probability because

\[
|-\alpha|^2=|\alpha|^2.
\]

The algorithm therefore still returns 0.

---

# 12. Common misconceptions

## Misconception 1: Deutsch’s algorithm reads both function values directly

It does not measure \(f(0)\) and \(f(1)\) separately. It uses phase kickback and interference to determine whether they are equal.

## Misconception 2: The oracle is an irreversible classical black box

A quantum oracle must be implemented as a reversible unitary operation:

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

## Misconception 3: The ancilla is unnecessary

The ancilla enables the reversible function oracle and is prepared in \(|-\rangle\) to create phase kickback.

## Misconception 4: A global minus sign changes the answer

A global phase does not affect measurement probabilities. Only relative phase affects interference.

## Misconception 5: One query means one classical function evaluation

A quantum query acts coherently on a superposition of inputs. It is not equivalent to evaluating only \(f(0)\) or only \(f(1)\).

## Misconception 6: Deutsch’s algorithm solves all function problems in one query

It solves the promised constant-versus-balanced problem. Removing the promise changes the task.

## Misconception 7: The algorithm is automatically faster in wall-clock time

The one-query advantage is a query-complexity result. Oracle construction, gate decomposition, measurement, and hardware noise still matter.

---

# 13. Chapter summary

Deutsch’s algorithm solves the promised problem of determining whether a Boolean function

\[
f:\{0,1\}\rightarrow\{0,1\}
\]

is constant or balanced.

A deterministic classical algorithm needs two queries in the worst case. Deutsch’s quantum algorithm uses one oracle query.

The reversible oracle is

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

The ancilla is prepared in

\[
|-\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2},
\]

which is an eigenstate of X. This creates phase kickback:

\[
U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
\]

The final Hadamard converts the relative phase into a measurement result:

\[
z=f(0)\oplus f(1).
\]

Therefore:

\[
z=0\Rightarrow f\text{ is constant},
\]

\[
z=1\Rightarrow f\text{ is balanced}.
\]

The algorithm introduces ideas used throughout quantum computing: reversible oracles, ancillas, phase kickback, interference, query complexity, and extraction of global function properties.

---

# 14. Formula sheet

Deutsch problem:

\[
f:\{0,1\}\rightarrow\{0,1\}.
\]

Constant condition:

\[
f(0)=f(1).
\]

Balanced condition:

\[
f(0)\neq f(1).
\]

Oracle:

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

Minus state:

\[
|-\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

Phase kickback:

\[
U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
\]

Final decision bit:

\[
z=f(0)\oplus f(1).
\]

Quantum query complexity:

\[
Q(f)=1.
\]

Deterministic classical query complexity:

\[
D(f)=2.
\]

Hadamard transformations:

\[
H|+\rangle=|0\rangle,
\qquad
H|-\rangle=|1\rangle.
\]

Shot-based estimate:

\[
\hat P(z)=\frac{N_z}{N}.
\]

---

# 15. Review questions and exercises

## Conceptual questions

1. State the Deutsch problem.
2. What does it mean for a Boolean function to be constant?
3. What does it mean for a Boolean function to be balanced?
4. Why does a deterministic classical algorithm need two queries?
5. Why must a quantum oracle be reversible?
6. What is the purpose of the ancilla qubit?
7. Why is the ancilla prepared in \(|-\rangle\)?
8. What is phase kickback?
9. What does the final Hadamard gate accomplish?
10. What measurement result represents a constant function?
11. What measurement result represents a balanced function?
12. What is the query complexity of Deutsch’s algorithm?

## Numerical exercises

1. List all four Boolean functions from \(\{0,1\}\) to \(\{0,1\}\).
2. Classify the function with \(f(0)=0\) and \(f(1)=1\).
3. Calculate \(f(0)\oplus f(1)\) for each of the four functions.
4. Verify that \(X|-\rangle=-|-\rangle\).
5. Derive
   \[
   U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
   \]
6. Calculate the state after the initial H gates.
7. Calculate the first-qubit state after the oracle for the identity function.
8. Calculate the first-qubit state after the oracle for the negated identity function.
9. Calculate the estimated output probability if 992 of 1,000 shots return 1.
10. Explain why a global phase does not change the measurement result.

## Circuit exercises

Draw and analyze the Deutsch circuit for:

1. The constant-zero oracle.
2. The constant-one oracle.
3. The identity oracle.
4. The negated identity oracle.
5. An oracle implemented with CNOT.
6. The connection between Deutsch’s circuit and the Deutsch–Jozsa circuit.

For each circuit:

- Write the state after initialization.
- Write the state after the first Hadamard layer.
- Apply phase kickback.
- Apply the final Hadamard.
- Predict the measurement result.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement all four one-bit Boolean oracles.
2. Build Deutsch’s circuit for each oracle.
3. Run each circuit for 100 and 1,000 shots.
4. Confirm that constant functions return 0 and balanced functions return 1.
5. Inspect the state vector before and after the oracle.
6. Add a simple noise model and measure the error rate.
7. Compare the quantum query count with a deterministic classical implementation.

---

# 16. Glossary

**Ancilla:** An additional qubit used to support a computation, oracle, or reversible transformation.

**Balanced function:** A Boolean function that outputs 0 and 1 equally often over its promised input set.

**Constant function:** A function with the same output for every input in its domain.

**Deutsch’s algorithm:** A one-query quantum algorithm that determines whether a one-bit Boolean function is constant or balanced.

**Global phase:** A phase factor multiplying the entire state; it does not affect measurement probabilities.

**Oracle:** A reversible unitary operation that encodes a function or problem property.

**Phase kickback:** The transfer of a phase caused by a controlled operation into another register or control branch.

**Query complexity:** The number of oracle calls made by an algorithm.

**Relative phase:** The phase difference between components of a superposition; it can affect interference.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevLett.64.2495 "Quantum computational complexity"

[4]: https://doi.org/10.1098/rspa.1992.0167 "Quantum mechanical computers"

[5]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[6]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

## Key formulas: derivation and interpretation

### Deutsch oracle

\[
U_f|x,y\rangle=|x,y\oplus f(x)\rangle.
\]

**Derivation:** The oracle preserves the input \(x\) and reversibly writes the function value into the target using XOR, denoted \(\oplus\). If the target is prepared as \(|-\rangle=(|0\rangle-|1\rangle)/\sqrt2\), then:

\[
X^{f(x)}|-\rangle=(-1)^{f(x)}|-\rangle.
\]

Thus the function value becomes a phase on the input branch. One oracle query is enough to distinguish constant from balanced functions after Hadamard operations.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is Deutsch’s problem?
   **Answer:** Determine whether a one-bit Boolean function is constant or balanced.

2. **Question:** What is a constant function?
   **Answer:** A function with the same output for both possible inputs.

3. **Question:** What is a balanced function?
   **Answer:** A function that outputs 0 for one input and 1 for the other.

4. **Question:** What is phase kickback?
   **Answer:** Transfer of a function value into the phase of a control state.

5. **Question:** How many oracle queries does Deutsch’s algorithm use?
   **Answer:** One quantum oracle query.

### Chapter quiz

1. What is Deutsch’s problem?

2. What is a constant function?

3. What is a balanced function?

4. What is phase kickback?

5. How many oracle queries does Deutsch’s algorithm use?

### Quiz answer key

1. **Determine whether a one-bit Boolean function is constant or balanced.**

2. **A function with the same output for both possible inputs.**

3. **A function that outputs 0 for one input and 1 for the other.**

4. **Transfer of a function value into the phase of a control state.**

5. **One quantum oracle query.**


---


# Chapter 3: Deutsch–Jozsa Algorithm {#chapter-3-deutsch-jozsa-algorithm}

## 3.1 Chapter overview

The **Deutsch–Jozsa algorithm** is a foundational quantum algorithm that generalizes Deutsch’s one-bit problem to functions with many input bits. It demonstrates an exact quantum query advantage over deterministic classical computation.

The algorithm receives a Boolean function

\[
f:\{0,1\}^n\rightarrow\{0,1\},
\]

with the promise that the function is either:

- **Constant:** The function returns the same value for every one of its \(2^n\) inputs.
- **Balanced:** The function returns 0 for exactly half of its inputs and 1 for exactly half.

The task is to determine whether the function is constant or balanced.

A deterministic classical algorithm may need

\[
2^{n-1}+1
\]

queries in the worst case. The Deutsch–Jozsa algorithm needs one oracle query and determines the answer with certainty in the ideal model.

The algorithm uses:

- An \(n\)-qubit input register.
- One ancilla qubit.
- Hadamard gates.
- A reversible function oracle.
- Phase kickback.
- A final Hadamard layer.
- Measurement of the input register.

The key result is:

\[
\text{constant function}
\Rightarrow
|0\rangle^{\otimes n}
\text{ is measured},
\]

while

\[
\text{balanced function}
\Rightarrow
\text{any nonzero input string is measured}.
\]

The algorithm is primarily a query-complexity demonstration. Its promise is strong, and the oracle-construction cost must be considered when evaluating practical performance.

---

## 3.2 Learning objectives

After studying this chapter, learners should be able to:

1. State the Deutsch–Jozsa problem.
2. Define constant and balanced functions on \(n\)-bit inputs.
3. Explain the promise condition.
4. Construct the reversible oracle \(U_f\).
5. Describe the input and ancilla registers.
6. Explain phase kickback in the algorithm.
7. Derive the final amplitude of the all-zero state.
8. Prove why constant and balanced functions produce different outcomes.
9. Compare classical and quantum query complexity.
10. Analyze small examples of Deutsch–Jozsa circuits.
11. Implement the algorithm in a quantum programming framework.
12. Explain the limitations of the promised problem.

---

# 4. The Deutsch–Jozsa problem

## 4.1 Boolean function on n-bit inputs

The function is

\[
f:\{0,1\}^n\rightarrow\{0,1\}.
\]

The domain contains all binary strings of length \(n\). There are

\[
2^n
\]

possible inputs:

\[
|00\cdots0\rangle,
|00\cdots1\rangle,
\ldots,
|11\cdots1\rangle.
\]

The function produces one classical bit for each input string.

## 4.2 Constant functions

A function is constant when it returns the same value for all inputs. There are two constant functions:

\[
f(x)=0\quad\text{for every }x,
\]

or

\[
f(x)=1\quad\text{for every }x.
\]

The number of inputs mapped to 0 is either \(2^n\) or 0.

## 4.3 Balanced functions

A function is balanced when exactly half of the inputs produce 0 and exactly half produce 1:

\[
\left|\{x:f(x)=0\}\right|=2^{n-1},
\]

and

\[
\left|\{x:f(x)=1\}\right|=2^{n-1}.
\]

For \(n=2\), a balanced function has two inputs mapped to 0 and two inputs mapped to 1.

## 4.4 Promise problem

The algorithm is given a **promise** that the function is either constant or balanced. It does not need to work correctly for functions that are neither.

A promise problem is a computational problem in which the input is guaranteed to belong to a specified class. The promise simplifies the task and is part of the problem definition.

## 4.5 Objective function

The goal can be written as determining

\[
\begin{cases}
\text{constant},&\text{if }f(x)\text{ is identical for all }x,\\
\text{balanced},&\text{if }f(x)=0\text{ and }1\text{ equally often}.
\end{cases}
\]

The algorithm does not need to determine the complete truth table of \(f\).

---

# 5. Classical solution

## 5.1 Deterministic classical strategy

A deterministic classical algorithm evaluates the function on different inputs until it has enough evidence to distinguish the two promised cases.

If the first

\[
2^{n-1}
\]

outputs are all equal, the function could still be constant or balanced. The next query is needed to decide:

- If the next output is the same, the function is constant.
- If the next output differs, the function is balanced.

Therefore, the worst-case deterministic query complexity is

\[
D(f)=2^{n-1}+1.
\]

## 5.2 Why fewer queries are insufficient

After observing at most \(2^{n-1}\) identical outputs, there may still be two functions consistent with the observations:

- A constant function with the same output everywhere.
- A balanced function that changes on the unseen inputs.

Thus, a deterministic classical method cannot guarantee the answer before the extra query.

## 5.3 Randomized classical methods

A randomized classical algorithm may sample inputs and make a probabilistic decision. It can often achieve high confidence using fewer queries than the deterministic worst case, but it does not achieve the same exact one-query guarantee as the ideal quantum algorithm.

The comparison in the original Deutsch–Jozsa result is between one exact quantum query and the deterministic classical worst case.

---

# 6. The reversible oracle

## 6.1 Oracle definition

A quantum oracle for \(f\) is a unitary transformation

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle,
\]

where:

- \(|x\rangle\) is the \(n\)-qubit input register.
- \(|y\rangle\) is the one-qubit ancilla.
- \(\oplus\) is XOR, or addition modulo 2.

## 6.2 Why the input is preserved

The input \(x\) is kept in the first register. This makes the transformation reversible even when the classical function is many-to-one.

If the ancilla begins in \(|0\rangle\), then

\[
U_f|x\rangle|0\rangle=|x\rangle|f(x)\rangle.
\]

The function value is written into the ancilla without erasing the input.

## 6.3 Oracle unitarity

Applying the oracle twice gives

\[
U_f^2|x\rangle|y\rangle
=|x\rangle|(y\oplus f(x))\oplus f(x)\rangle
=|x\rangle|y\rangle.
\]

Therefore,

\[
U_f^{-1}=U_f.
\]

## 6.4 Phase oracle form

When the ancilla is prepared in \(|-\rangle\), the oracle becomes a phase oracle on the input register:

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

This is phase kickback. The function value is encoded in the sign of the input-state amplitude.

---

# 7. Registers and initialization

## 7.1 Input register

The input register contains \(n\) qubits. It begins in

\[
|0\rangle^{\otimes n}=|00\cdots0\rangle.
\]

## 7.2 Ancilla register

The algorithm uses one additional qubit initialized in \(|1\rangle\). The complete initial state is

\[
|\psi_0\rangle
=|0\rangle^{\otimes n}|1\rangle.
\]

## 7.3 Hadamard preparation

Apply H to every qubit:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}|x\rangle.
\]

For the ancilla,

\[
H|1\rangle=|-\rangle
=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

The state after the first Hadamard layer is

\[
|\psi_1\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x|x\rangle|-\rangle.
\]

The input register is now a uniform superposition over all possible inputs.

---

# 8. Phase kickback in Deutsch–Jozsa

## 8.1 Oracle action on the superposition

Apply the oracle to the state

\[
|\psi_1\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x|x\rangle|-\rangle.
\]

Using phase kickback,

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

Therefore,

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{f(x)}|x\rangle|-\rangle.
\]

The ancilla remains factored out. All information about the function is now in the phase pattern of the input register.

## 8.2 Constant-zero case

If \(f(x)=0\) for every \(x\), then

\[
(-1)^{f(x)}=1
\]

for every input. Thus,

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x|x\rangle|-\rangle.
\]

The input register remains the uniform superposition.

## 8.3 Constant-one case

If \(f(x)=1\) for every \(x\), then

\[
(-1)^{f(x)}=-1
\]

for every input. Thus,

\[
|\psi_2\rangle
=-\frac{1}{\sqrt{2^n}}
\sum_x|x\rangle|-\rangle.
\]

This is a global phase change relative to the constant-zero case. It has no measurement effect.

## 8.4 Balanced case

If \(f\) is balanced, half of the terms acquire a plus sign and half acquire a minus sign:

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\left(
\sum_{x:f(x)=0}|x\rangle
-
\sum_{x:f(x)=1}|x\rangle
\right)|-\rangle.
\]

The phase pattern is not global. It is a relative-phase pattern that can interfere destructively at the all-zero output.

---

# 9. The Deutsch–Jozsa circuit

## 9.1 Circuit diagram

The circuit contains an \(n\)-qubit input register and one ancilla:

```text
q0: ──H──────┐        ┌────H────M──
q1: ──H──────┤        ├────H────M──
⋮            │  Uf    │
q(n-1):─H───┤        ├────H────M──
ancilla: ─X─H─────────┘
```

A clearer abstract representation is

```text
input register:  H⊗n ── Uf ── H⊗n ── measure
ancilla:         X ─ H ─ Uf
```

The oracle acts on the input register and ancilla. The final Hadamard layer is applied only to the input register.

## 9.2 Algorithm steps

1. Prepare the input register in \(|0\rangle^{\otimes n}\).
2. Prepare the ancilla in \(|1\rangle\).
3. Apply H to every qubit.
4. Apply the oracle \(U_f\) once.
5. Apply H to every input qubit.
6. Measure the input register.
7. Classify the function from the result.

## 9.3 Decision rule

If the measured input string is

\[
00\cdots0,
\]

then the function is constant.

If the measured string is anything other than

\[
00\cdots0,
\]

then the function is balanced.

In the ideal promised setting, this decision is deterministic.

---

# 10. Mathematical proof of the algorithm

## 10.1 State before the final Hadamard

After the oracle,

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{f(x)}|x\rangle|-\rangle.
\]

Apply \(H^{\otimes n}\) to the input register.

The amplitude of an output string \(z\) is

\[
A_z
=\frac{1}{2^n}
\sum_{x\in\{0,1\}^n}
(-1)^{f(x)}(-1)^{x\cdot z},
\]

where

\[
x\cdot z=x_0z_0\oplus x_1z_1\oplus\cdots\oplus x_{n-1}z_{n-1}
\]

is the bitwise inner product modulo 2.

This is a Walsh–Hadamard transform of the phase function \((-1)^{f(x)}\).

## 10.2 Amplitude of the all-zero output

For \(z=0^n\),

\[
x\cdot0^n=0
\]

for every \(x\). Thus,

\[
A_{0^n}
=\frac{1}{2^n}
\sum_x(-1)^{f(x)}.
\]

## 10.3 Constant functions

If \(f\) is constant zero,

\[
\sum_x(-1)^{f(x)}=2^n,
\]

so

\[
A_{0^n}=1.
\]

If \(f\) is constant one,

\[
\sum_x(-1)^{f(x)}=-2^n,
\]

so

\[
A_{0^n}=-1.
\]

In either constant case,

\[
P(0^n)=|A_{0^n}|^2=1.
\]

## 10.4 Balanced functions

For a balanced function, exactly half the terms in the sum are +1 and half are -1:

\[
\sum_x(-1)^{f(x)}
=2^{n-1}-2^{n-1}=0.
\]

Therefore,

\[
A_{0^n}=0,
\]

and

\[
P(0^n)=0.
\]

Thus, measuring \(0^n\) identifies a constant function, while any nonzero result identifies a balanced function.

## 10.5 Why the result is exact

The constant and balanced cases produce mathematically distinct amplitudes for \(0^n\):

\[
P(0^n)=1\quad\text{for constant},
\]

\[
P(0^n)=0\quad\text{for balanced}.
\]

There is no ideal statistical ambiguity. The algorithm succeeds with probability 1, assuming a correct oracle and perfect gates.

---

# 11. Small examples

## 11.1 Two-bit constant-zero function

Let \(n=2\) and

\[
f(x)=0
\]

for all four inputs. The input register becomes

\[
\frac{|00\rangle+|01\rangle+|10\rangle+|11\rangle}{2}.
\]

The oracle creates no relative phase. The final H layer maps this state to

\[
|00\rangle.
\]

The function is classified as constant.

## 11.2 Two-bit constant-one function

Let

\[
f(x)=1
\]

for all four inputs. All input branches acquire a minus sign:

\[
-\frac{|00\rangle+|01\rangle+|10\rangle+|11\rangle}{2}.
\]

The final H layer produces \(-|00\rangle\). The global minus sign has no measurement effect, so the measured string is still 00.

## 11.3 Two-bit balanced parity function

Let

\[
f(x_0,x_1)=x_0\oplus x_1.
\]

The truth table is:

| Input | Output |
|---|---:|
| 00 | 0 |
| 01 | 1 |
| 10 | 1 |
| 11 | 0 |

The phase state after the oracle is

\[
\frac{|00\rangle-|01\rangle-|10\rangle+|11\rangle}{2}.
\]

The final H layer maps this state to a nonzero computational-basis string, specifically \(|11\rangle\) under the standard qubit-order convention. Since the result is not 00, the function is identified as balanced.

## 11.4 Two-bit balanced function with a different pattern

Let

\[
f(00)=0,
\quad f(01)=0,
\quad f(10)=1,
\quad f(11)=1.
\]

The phase pattern is

\[
\frac{|00\rangle+|01\rangle-|10\rangle-|11\rangle}{2}.
\]

The final H layer produces a nonzero string corresponding to the phase pattern. The exact nonzero string depends on the bit ordering, but it cannot be 00 because the function is balanced.

## 11.5 Three-bit constant function

For \(n=3\) and \(f(x)=0\), the input register begins as

\[
|+\rangle^{\otimes3}
=\frac{1}{\sqrt8}
\sum_{x\in\{0,1\}^3}|x\rangle.
\]

The final H layer returns

\[
|000\rangle.
\]

## 11.6 Three-bit balanced function

Let

\[
f(x_0,x_1,x_2)=x_0.
\]

Exactly half of the eight inputs have \(x_0=0\), and half have \(x_0=1\). The function is balanced. After the final H layer, the result is a nonzero string associated with the first-bit phase pattern, such as \(|100\rangle\) under one standard ordering.

---

# 12. Query complexity and speedup

## 12.1 Quantum query complexity

The Deutsch–Jozsa algorithm makes exactly one oracle query:

\[
Q(f)=1.
\]

The number of input qubits grows with \(n\), but the number of oracle calls remains one.

## 12.2 Deterministic classical query complexity

A deterministic classical algorithm requires

\[
D(f)=2^{n-1}+1
\]

queries in the worst case.

For example:

| \(n\) | Classical worst case | Quantum queries |
|---:|---:|---:|
| 1 | 2 | 1 |
| 2 | 3 | 1 |
| 3 | 5 | 1 |
| 4 | 9 | 1 |
| 5 | 17 | 1 |
| 10 | 513 | 1 |
| 20 | 524,289 | 1 |

## 12.3 Nature of the advantage

The query advantage grows exponentially with \(n\) in the oracle model:

\[
2^{n-1}+1\rightarrow1.
\]

However, the algorithm does not necessarily provide an exponential wall-clock speedup in a practical implementation. The cost of constructing the oracle may itself grow with \(n\), and the circuit requires \(n+1\) qubits and a final Hadamard layer.

## 12.4 Exact versus bounded-error algorithms

Deutsch–Jozsa is an **exact** quantum algorithm under the promise. It identifies the correct class with probability 1 in the ideal model.

A bounded-error algorithm may be correct with probability at least

\[
\frac23
\]

or another fixed constant greater than 1/2. Repetition can amplify bounded-error success, but Deutsch–Jozsa does not require this in the ideal setting.

---

# 13. Relationship to other algorithms

## 13.1 Deutsch’s algorithm

Deutsch’s algorithm is the \(n=1\) case of the Deutsch–Jozsa family. Both use:

- One input register.
- One ancilla.
- Hadamard gates.
- A reversible oracle.
- Phase kickback.
- A final interference step.

## 13.2 Bernstein–Vazirani algorithm

The Bernstein–Vazirani algorithm also uses a phase oracle and a final Hadamard layer. Its goal is to identify a hidden bit string \(s\) in a function such as

\[
f_s(x)=s\cdot x.
\]

The final measurement reveals \(s\) in one oracle query.

## 13.3 Simon’s algorithm

Simon’s algorithm solves a hidden-period problem for a two-to-one function. It uses repeated measurements to gather linear equations about a hidden string. It is an important precursor to Shor’s algorithm.

## 13.4 Grover’s algorithm

Deutsch–Jozsa uses interference to distinguish global function properties. Grover’s algorithm uses phase marking and amplitude amplification to locate a marked input. Both use oracles, but their output goals differ.

---

# 14. Implementation considerations

## 14.1 High-level pseudocode

```text
function DeutschJozsa(n, oracle):
    create n input qubits in |0⟩
    create one ancilla qubit in |1⟩

    apply H to every input qubit
    apply H to the ancilla

    apply oracle Uf once

    apply H to every input qubit
    measure input register

    if measured string == 00...0:
        return "constant"
    else:
        return "balanced"
```

## 14.2 Oracle construction

The oracle must implement

\[
|x\rangle|y\rangle
\mapsto
|x\rangle|y\oplus f(x)\rangle.
\]

For a simple linear function,

\[
f(x)=s\cdot x,
\]

the oracle can often be constructed using CNOT gates from input qubits selected by the bits of \(s\).

## 14.3 Circuit depth

The logical circuit includes:

- One H layer on the input register.
- One H gate on the ancilla.
- One oracle operation.
- One H layer on the input register.
- Measurement.

The oracle may dominate the depth. A compact oracle notation does not guarantee a shallow physical implementation.

## 14.4 Simulator experiment

A basic experiment is:

1. Choose a constant or balanced truth table.
2. Build the corresponding oracle.
3. Run the circuit on an ideal simulator.
4. Repeat for a fixed number of shots.
5. Verify that 00...0 identifies the constant case.
6. Add noise and measure incorrect-output frequency.

## 14.5 Hardware experiment

On hardware, the output may include incorrect strings because of:

- H-gate errors.
- Oracle gate errors.
- Two-qubit gate errors.
- Readout errors.
- Decoherence.
- Qubit-mapping overhead.

The result should be reported with the backend, number of shots, qubit mapping, and oracle implementation.

---

# 15. Common misconceptions

## Misconception 1: The algorithm reads the entire truth table

It does not. It determines only whether the function belongs to the promised constant or balanced class.

## Misconception 2: One query means every input is measured

The oracle acts on a superposition of inputs, but the final measurement returns one output string. Interference is what makes the global property detectable.

## Misconception 3: Every Boolean function is allowed

The algorithm assumes the promise that the function is constant or balanced. Functions outside the promise do not have a required classification.

## Misconception 4: The ancilla contains the final answer

The ancilla enables phase kickback but is not the register used to classify the function. The input register is measured after the final Hadamard layer.

## Misconception 5: A balanced function always produces one specific nonzero string

The algorithm guarantees only that the all-zero string has zero probability. The particular nonzero output depends on the function’s phase pattern.

## Misconception 6: Constant-one and constant-zero functions are different in the measurement

They differ by a global phase after phase kickback, so both produce the all-zero input result.

## Misconception 7: The exponential query advantage automatically means exponential practical speedup

Oracle construction, gate decomposition, circuit depth, measurements, and hardware noise must be included in a practical resource analysis.

---

# 16. Chapter summary

The Deutsch–Jozsa algorithm receives a promised Boolean function

\[
f:\{0,1\}^n\rightarrow\{0,1\}
\]

that is either constant or balanced. The goal is to determine which.

A deterministic classical algorithm needs

\[
2^{n-1}+1
\]

queries in the worst case. The quantum algorithm uses one oracle query:

\[
Q(f)=1.
\]

The algorithm prepares the input register in a uniform superposition and the ancilla in \(|-\rangle\). The reversible oracle

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle
\]

creates phase kickback:

\[
U_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle.
\]

The final Hadamard transform produces destructive interference at \(|0\rangle^{\otimes n}\) for balanced functions and constructive interference there for constant functions.

The decision rule is:

\[
0^n\text{ measured}
\Rightarrow
\text{constant},
\]

\[
\text{nonzero string measured}
\Rightarrow
\text{balanced}.
\]

The algorithm is exact in the ideal promised setting and introduces important techniques used in later quantum algorithms: oracle construction, phase kickback, Walsh–Hadamard transforms, interference, and query-complexity analysis.

---

# 17. Formula sheet

Function domain:

\[
f:\{0,1\}^n\rightarrow\{0,1\}.
\]

Number of inputs:

\[
2^n.
\]

Balanced-function counts:

\[
\left|\{x:f(x)=0\}\right|
=\left|\{x:f(x)=1\}\right|
=2^{n-1}.
\]

Reversible oracle:

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

Phase kickback:

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

Uniform input state:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac1{\sqrt{2^n}}\sum_x|x\rangle.
\]

Post-oracle input state:

\[
\frac1{\sqrt{2^n}}
\sum_x(-1)^{f(x)}|x\rangle.
\]

All-zero amplitude:

\[
A_{0^n}=\frac1{2^n}\sum_x(-1)^{f(x)}.
\]

Constant case:

\[
P(0^n)=1.
\]

Balanced case:

\[
P(0^n)=0.
\]

Classical deterministic query complexity:

\[
D(f)=2^{n-1}+1.
\]

Quantum query complexity:

\[
Q(f)=1.
\]

---

# 18. Review questions and exercises

## Conceptual questions

1. State the Deutsch–Jozsa problem.
2. What is the promise given to the algorithm?
3. How many inputs does an \(n\)-bit Boolean function have?
4. Define a constant function.
5. Define a balanced function.
6. Why does a deterministic classical algorithm need \(2^{n-1}+1\) queries?
7. Why is the oracle reversible?
8. What is the purpose of the ancilla?
9. Explain phase kickback.
10. Why is the all-zero result associated with a constant function?
11. Why can a balanced function never produce the all-zero result ideally?
12. What is the quantum query complexity of Deutsch–Jozsa?
13. What is the difference between an exact and bounded-error algorithm?
14. Why does a nonzero result not identify one unique balanced function?

## Numerical exercises

1. Calculate the number of input strings for \(n=4\).
2. How many zero outputs and one outputs does a balanced 5-bit function have?
3. Calculate the classical worst-case query complexity for \(n=3\), \(n=6\), and \(n=10\).
4. Write the full truth table for a two-bit parity function.
5. Verify that the constant-zero function gives \(A_{0^n}=1\).
6. Verify that the constant-one function gives \(A_{0^n}=-1\).
7. Verify that a balanced function gives \(A_{0^n}=0\).
8. Calculate the final output for the two-bit function \(f(x_0,x_1)=x_0\oplus x_1\).
9. Calculate the phase pattern for a function with outputs 0, 1, 0, 1 on inputs 00, 01, 10, 11.
10. Explain why a global minus sign does not change the constant-function measurement.

## Circuit exercises

Draw and analyze Deutsch–Jozsa circuits for:

1. A two-bit constant-zero oracle.
2. A two-bit constant-one oracle.
3. The two-bit parity function.
4. A balanced function with truth table 0, 0, 1, 1.
5. A three-bit function \(f(x)=x_0\).
6. A linear function \(f(x)=s\cdot x\).

For each circuit:

- Write the initial state.
- Apply the first Hadamard layer.
- Apply phase kickback.
- Apply the final Hadamard layer.
- Predict the measurement outcome.
- Classify the function.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement a two-qubit Deutsch–Jozsa circuit.
2. Build constant and balanced oracles.
3. Verify the algorithm on all promised functions for \(n=2\).
4. Extend the implementation to \(n=3\) and \(n=4\).
5. Run each circuit on an ideal simulator.
6. Add a noise model and measure the probability of an incorrect classification.
7. Compare one quantum oracle call with classical truth-table evaluation.
8. Inspect the compiled circuit depth and gate count.

---

# 19. Glossary

**Balanced function:** A Boolean function that outputs 0 and 1 equally often over its domain.

**Constant function:** A function that produces the same output for every input.

**Deutsch–Jozsa algorithm:** An exact quantum algorithm that distinguishes a promised constant function from a promised balanced function using one oracle query.

**Function oracle:** A reversible quantum operation that encodes the value of a function.

**Hadamard layer:** A parallel application of H gates to a register.

**Promise problem:** A problem in which inputs are guaranteed to satisfy a stated condition.

**Query complexity:** The number of oracle applications used by an algorithm.

**Walsh–Hadamard transform:** The multi-qubit transformation implemented by \(H^{\otimes n}\).

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevA.54.117 "Rapid solution of problems by quantum computation"

[4]: https://doi.org/10.1103/PhysRevLett.81.3071 "Strengths and weaknesses of quantum computing"

[5]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[6]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

## Key formulas: derivation and interpretation

### Deutsch–Jozsa promise and constant-state amplitude

For n input qubits:

\[
H^{\otimes n}|0^n\rangle=\frac{1}{\sqrt{2^n}}\sum_{x\in\{0,1\}^n}|x\rangle.
\]

After phase kickback, the state is:

\[
\frac{1}{\sqrt{2^n}}\sum_x(-1)^{f(x)}|x\rangle.
\]

The amplitude of \(|0^n\rangle\) after the final Hadamards is:

\[
\frac{1}{2^n}\sum_x(-1)^{f(x)}.
\]

**Derivation:** A constant function gives identical signs, so the sum is \(\pm1\). A balanced function has equal positive and negative terms, so the sum is zero. Therefore the all-zero measurement identifies the constant case.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What promise defines the Deutsch–Jozsa problem?
   **Answer:** The function is promised to be either constant or balanced.

2. **Question:** What is the classical worst-case query count?
   **Answer:** It can require 2^(n−1)+1 queries in the deterministic setting.

3. **Question:** What is the quantum query count?
   **Answer:** One oracle query.

4. **Question:** What measurement identifies a constant function?
   **Answer:** Measuring all zeros in the input register.

5. **Question:** What is the main advantage?
   **Answer:** Exponential query reduction under the promise problem.

### Chapter quiz

1. What promise defines the Deutsch–Jozsa problem?

2. What is the classical worst-case query count?

3. What is the quantum query count?

4. What measurement identifies a constant function?

5. What is the main advantage?

### Quiz answer key

1. **The function is promised to be either constant or balanced.**

2. **It can require 2^(n−1)+1 queries in the deterministic setting.**

3. **One oracle query.**

4. **Measuring all zeros in the input register.**

5. **Exponential query reduction under the promise problem.**


---


# Chapter 4: Bernstein–Vazirani Algorithm {#chapter-4-bernstein-vazirani-algorithm}

## 4.1 Chapter overview

The **Bernstein–Vazirani algorithm** is a foundational quantum algorithm for discovering a hidden bit string. It shows how a quantum computer can identify an unknown \(n\)-bit string using a single oracle query, while a deterministic classical algorithm generally needs \(n\) queries.

The problem is defined by a hidden string

\[
s=s_0s_1\cdots s_{n-1}\in\{0,1\}^n.
\]

The oracle evaluates the Boolean function

\[
f_s(x)=s\cdot x\pmod 2,
\]

where the dot product is calculated modulo 2:

\[
s\cdot x=s_0x_0\oplus s_1x_1\oplus\cdots\oplus s_{n-1}x_{n-1}.
\]

The goal is to determine the hidden string \(s\).

A deterministic classical algorithm can learn one bit of \(s\) per carefully chosen query, requiring \(n\) queries. The Bernstein–Vazirani quantum algorithm uses one oracle query and returns \(s\) exactly in the ideal setting.

The circuit is structurally similar to the Deutsch–Jozsa algorithm:

```text
input:   H⊗n ── Uf ── H⊗n ── measure
ancilla: X ─ H ─ Uf
```

The oracle evaluates the function on a superposition of all inputs. The ancilla is prepared in \(|-\rangle\), causing phase kickback. The resulting phase pattern is precisely the hidden string’s parity function. A final Hadamard transform converts the phase pattern into the computational-basis state \(|s\rangle\).

The central result is

\[
H^{\otimes n}U_{f_s}H^{\otimes n}|0\rangle^{\otimes n}|-\rangle
=|s\rangle|-\rangle,
\]

up to an irrelevant global phase convention.

---

## 4.2 Learning objectives

After studying this chapter, learners should be able to:

1. State the Bernstein–Vazirani problem.
2. Define a hidden bit string and its parity function.
3. Compute a binary dot product modulo 2.
4. Construct the reversible Bernstein–Vazirani oracle.
5. Explain the role of the ancilla qubit.
6. Derive phase kickback for the hidden-string oracle.
7. Follow the complete Bernstein–Vazirani circuit.
8. Explain why the final measurement returns the hidden string.
9. Compare classical and quantum query complexity.
10. Work through one-, two-, and multi-bit examples.
11. Implement the algorithm in a quantum software framework.
12. Relate Bernstein–Vazirani to Deutsch and Deutsch–Jozsa algorithms.

---

# 5. The Bernstein–Vazirani problem

## 5.1 Hidden string

Let

\[
s\in\{0,1\}^n
\]

be an unknown bit string. For example, when \(n=4\), possible hidden strings include

\[
0000,\ 0001,\ 1010,\ 1111.
\]

The algorithm is given access to an oracle that depends on \(s\), but the string itself is not directly revealed.

## 5.2 Hidden parity function

The oracle computes

\[
f_s(x)=s\cdot x\pmod2,
\]

where

\[
s\cdot x=s_0x_0\oplus s_1x_1\oplus\cdots\oplus s_{n-1}x_{n-1}.
\]

The operation \(\oplus\) is XOR, or addition modulo 2.

The function returns 1 when the selected bits of \(x\) have odd parity and returns 0 when they have even parity.

## 5.3 Example of the dot product

Let

\[
s=1011,
\qquad
x=1101.
\]

Then

\[
s\cdot x
=(1\cdot1)\oplus(0\cdot1)\oplus(1\cdot0)\oplus(1\cdot1).
\]

Therefore,

\[
s\cdot x=1\oplus0\oplus0\oplus1=0.
\]

Thus,

\[
f_s(1101)=0.
\]

## 5.4 Objective

The goal is to determine all bits of \(s\), not merely evaluate the function for one input:

\[
\text{given oracle access to }f_s,\quad\text{find }s.
\]

The hidden string is sometimes called a secret string, unknown string, or parity-mask string.

---

# 6. Key definitions

## 6.1 Binary string

A **binary string** of length \(n\) is an ordered sequence of \(n\) bits. It is written as

\[
x=x_0x_1\cdots x_{n-1}.
\]

## 6.2 XOR

**XOR**, denoted by \(\oplus\), is addition modulo 2:

\[
0\oplus0=0,
\qquad
0\oplus1=1,
\]

\[
1\oplus0=1,
\qquad
1\oplus1=0.
\]

## 6.3 Binary dot product

The **binary dot product** is the XOR sum of bitwise products:

\[
s\cdot x=\bigoplus_{j=0}^{n-1}s_jx_j.
\]

It produces one bit.

## 6.4 Parity

The **parity** of a collection of bits is their sum modulo 2. Even parity gives 0 and odd parity gives 1.

The function \(f_s(x)=s\cdot x\) is a parity function over the positions where \(s_j=1\).

## 6.5 Hidden-string oracle

A **hidden-string oracle** is a reversible unitary that computes the parity function into an ancilla:

\[
U_s|x\rangle|y\rangle
=|x\rangle|y\oplus(s\cdot x)\rangle.
\]

## 6.6 Query

A **query** is one application of the oracle. Bernstein–Vazirani uses one quantum query, while the standard deterministic classical strategy requires \(n\) queries.

## 6.7 Phase encoding

The algorithm uses phase encoding to place the value \(s\cdot x\) into the amplitude sign:

\[
|x\rangle\mapsto(-1)^{s\cdot x}|x\rangle.
\]

This phase pattern contains enough information for a final Hadamard transform to recover \(s\).

---

# 7. Classical solution

## 7.1 Learning one bit per query

A deterministic classical algorithm can discover the hidden string by querying the standard basis inputs:

\[
e_0=100\cdots0,
\]

\[
e_1=010\cdots0,
\]

and so on through

\[
e_{n-1}=000\cdots1.
\]

For the basis input \(e_j\),

\[
f_s(e_j)=s_j.
\]

Each query directly reveals one bit of \(s\).

## 7.2 Classical query complexity

The classical algorithm needs one query for each hidden-string bit:

\[
D(f_s)=n.
\]

After querying all basis vectors, the algorithm has obtained

\[
f_s(e_0),f_s(e_1),\ldots,f_s(e_{n-1})
=s_0,s_1,\ldots,s_{n-1}.
\]

## 7.3 Classical example

Suppose the unknown string is \(s=1011\). Query the basis inputs:

\[
e_0=1000,
\quad e_1=0100,
\quad e_2=0010,
\quad e_3=0001.
\]

The oracle returns

\[
f_s(1000)=1,
\]

\[
f_s(0100)=0,
\]

\[
f_s(0010)=1,
\]

\[
f_s(0001)=1.
\]

The classical algorithm reconstructs \(s=1011\) using four queries.

## 7.4 Classical information perspective

The hidden string contains \(n\) bits of information. In the classical oracle model, one chosen query returns one function bit. The quantum algorithm uses a coherent query to encode all parity relationships into phases and then extracts the complete string through interference.

---

# 8. The reversible oracle

## 8.1 Oracle definition

The Bernstein–Vazirani oracle is

\[
U_s|x\rangle|y\rangle
=|x\rangle|y\oplus(s\cdot x)\rangle.
\]

The input register is preserved and the parity value is XORed into the target qubit.

## 8.2 Reversibility

Applying the same oracle twice gives

\[
U_s^2|x\rangle|y\rangle
=|x\rangle|y\oplus(s\cdot x)\oplus(s\cdot x)\rangle
=|x\rangle|y\rangle.
\]

Therefore,

\[
U_s^{-1}=U_s.
\]

## 8.3 CNOT construction

The oracle can be constructed using CNOT gates. For every position \(j\) such that \(s_j=1\), apply a CNOT from input qubit \(x_j\) to the ancilla.

If

\[
s=1011,
\]

then the oracle uses CNOTs controlled by qubits 0, 2, and 3:

```text
x0: ──●────────────
      │
x1: ──────────────
x2: ─────●──────────
        │
x3: ───────●──────
          │
ancilla: ──X────────
```

The target ancilla receives the XOR of all selected input bits.

## 8.4 Matrix and operator viewpoint

For a fixed input \(x\), the target undergoes X if \(s\cdot x=1\) and I if \(s\cdot x=0\). Thus, the oracle is a collection of controlled-X operations determined by the hidden string.

---

# 9. Phase kickback

## 9.1 Ancilla preparation

Begin the ancilla in \(|1\rangle\) and apply H:

\[
H|1\rangle=|-\rangle
=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

Since

\[
X|-\rangle=-|-\rangle,
\]

an X operation on the ancilla creates a minus sign without changing its observable state.

## 9.2 Kickback derivation

Apply the oracle to \(|x\rangle|-\rangle\):

\[
U_s|x\rangle|-\rangle
=|x\rangle X^{s\cdot x}|-\rangle.
\]

If \(s\cdot x=0\), then the target receives I:

\[
I|-\rangle=|-\rangle.
\]

If \(s\cdot x=1\), then the target receives X:

\[
X|-\rangle=-|-\rangle.
\]

Therefore,

\[
U_s|x\rangle|-\rangle
=(-1)^{s\cdot x}|x\rangle|-\rangle.
\]

## 9.3 Phase oracle form

The ancilla factors out, leaving an effective phase oracle on the input register:

\[
O_s|x\rangle=(-1)^{s\cdot x}|x\rangle.
\]

The hidden string is now represented in the phase function

\[
\chi_s(x)=(-1)^{s\cdot x}.
\]

This function is a character of the binary vector space and is orthogonal to the corresponding characters for different hidden strings.

---

# 10. Bernstein–Vazirani circuit

## 10.1 Circuit diagram

For an \(n\)-qubit input register:

```text
x0: ──H──────┐        ┌────H────M──
x1: ──H──────┤        ├────H────M──
⋮            │  Us    │
x(n-1):─H───┤        ├────H────M──
ancilla: ─X─H─────────┘
```

In compact form:

```text
input register:  H⊗n ── Us ── H⊗n ── measure
ancilla:         X ─ H ─ Us
```

## 10.2 Algorithm steps

1. Prepare the input register in \(|0\rangle^{\otimes n}\).
2. Prepare the ancilla in \(|1\rangle\).
3. Apply H to all input qubits.
4. Apply H to the ancilla to create \(|-\rangle\).
5. Apply the hidden-string oracle \(U_s\) once.
6. Apply H to all input qubits.
7. Measure the input register.
8. Interpret the measured string as \(s\).

## 10.3 Initial state

The initial state is

\[
|\psi_0\rangle=|0\rangle^{\otimes n}|1\rangle.
\]

After the first Hadamard layer,

\[
|\psi_1\rangle
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}|x\rangle|-\rangle.
\]

## 10.4 Oracle stage

The oracle produces

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{s\cdot x}|x\rangle|-\rangle.
\]

The phase pattern depends on the unknown string \(s\).

## 10.5 Final Hadamard layer

The final Hadamard transform maps the phase character to the computational-basis state \(|s\rangle\):

\[
H^{\otimes n}
\left(
\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{s\cdot x}|x\rangle
\right)
=|s\rangle.
\]

Therefore, measuring the input register returns the hidden string.

---

# 11. Mathematical derivation

## 11.1 Hadamard transform of a computational basis state

For an \(n\)-bit string \(z\),

\[
H^{\otimes n}|z\rangle
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}(-1)^{x\cdot z}|x\rangle.
\]

The Hadamard transform maps basis states to parity-phase patterns.

## 11.2 Orthogonality of parity characters

Consider the sum

\[
S(s,z)=\sum_{x\in\{0,1\}^n}(-1)^{s\cdot x}(-1)^{z\cdot x}.
\]

Combining exponents modulo 2,

\[
S(s,z)=\sum_x(-1)^{(s\oplus z)\cdot x}.
\]

If \(s=z\), then \(s\oplus z=0^n\), and every term is +1:

\[
S(s,s)=2^n.
\]

If \(s\neq z\), at least one bit of \(s\oplus z\) is 1. Half the terms have positive sign and half have negative sign, so

\[
S(s,z)=0.
\]

Therefore,

\[
S(s,z)=2^n\delta_{s,z},
\]

where \(\delta_{s,z}\) is 1 when \(s=z\) and 0 otherwise.

## 11.3 Final amplitude

After the oracle, the input state is

\[
|\phi_s\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{s\cdot x}|x\rangle.
\]

The amplitude of measuring \(|z\rangle\) after the final Hadamard is

\[
A_z
=\frac{1}{2^n}
\sum_x(-1)^{s\cdot x}(-1)^{z\cdot x}.
\]

Using the orthogonality result,

\[
A_z=\delta_{s,z}.
\]

Thus,

\[
P(z)=|A_z|^2=\delta_{s,z}.
\]

The hidden string is obtained with probability 1 in the ideal model.

## 11.4 Interpretation

The phase pattern generated by \(s\) is exactly the Hadamard image of \(|s\rangle\). Applying Hadamards again reverses that transformation because

\[
H^{\otimes n}H^{\otimes n}=I.
\]

Bernstein–Vazirani is therefore an elegant example of phase encoding followed by an inverse transform.

---

# 12. Worked examples

## 12.1 One-bit case

Let \(n=1\) and \(s=1\). Then

\[
f_s(x)=x.
\]

This is exactly the balanced identity function from Deutsch’s problem. The Bernstein–Vazirani circuit returns

\[
|1\rangle.
\]

If \(s=0\), the oracle is constant zero and the circuit returns \(|0\rangle\).

## 12.2 Two-bit hidden string \(s=10\)

Let

\[
s=10.
\]

Then

\[
f_s(x_0,x_1)=x_0.
\]

The truth table is

| Input \(x\) | \(s\cdot x\) |
|---|---:|
| 00 | 0 |
| 01 | 0 |
| 10 | 1 |
| 11 | 1 |

The phase state after the oracle is

\[
\frac{|00\rangle+|01\rangle-|10\rangle-|11\rangle}{2}.
\]

The final Hadamard transform produces

\[
|10\rangle.
\]

## 12.3 Two-bit hidden string \(s=11\)

Let

\[
s=11.
\]

Then

\[
f_s(x_0,x_1)=x_0\oplus x_1.
\]

The phase state is

\[
\frac{|00\rangle-|01\rangle-|10\rangle+|11\rangle}{2}.
\]

The final Hadamard transform returns

\[
|11\rangle.
\]

## 12.4 Three-bit hidden string \(s=101\)

Let

\[
s=101.
\]

Then

\[
f_s(x_0,x_1,x_2)=x_0\oplus x_2.
\]

The oracle is built from CNOTs controlled by the first and third input qubits and targeting the ancilla. After the final H layer, the input register is

\[
|101\rangle.
\]

## 12.5 Four-bit hidden string \(s=1011\)

For

\[
s=1011,
\]

the oracle applies CNOTs from input qubits 0, 2, and 3 to the ancilla. The hidden parity function is

\[
f_s(x)=x_0\oplus x_2\oplus x_3.
\]

The final measurement returns

\[
1011.
\]

## 12.6 Measurement counts

Suppose the circuit for \(s=1011\) is run for 1,000 ideal shots. An ideal simulator should return approximately

```text
1011 : 1000
```

On noisy hardware, the counts may look like

```text
1011 : 936
1001 : 18
0011 : 14
1010 : 12
other: 20
```

The dominant result is the hidden string, while incorrect strings arise from gate and measurement errors.

---

# 13. Query complexity and speedup

## 13.1 Quantum query complexity

The Bernstein–Vazirani algorithm uses one oracle query regardless of the hidden-string length:

\[
Q(f_s)=1.
\]

## 13.2 Classical query complexity

The standard deterministic classical algorithm uses one query per hidden bit:

\[
D(f_s)=n.
\]

## 13.3 Comparison

| Input length | Classical queries | Quantum queries |
|---:|---:|---:|
| 1 | 1 | 1 |
| 2 | 2 | 1 |
| 4 | 4 | 1 |
| 8 | 8 | 1 |
| 16 | 16 | 1 |
| 100 | 100 | 1 |

The quantum query advantage is linear in the oracle model:

\[
n\rightarrow1.
\]

## 13.4 What the query result means

The algorithm demonstrates a query-complexity separation, not an automatic total-runtime speedup. A practical analysis must include:

- The cost of constructing the oracle.
- The number of physical gates.
- Circuit depth.
- Qubit connectivity.
- Measurement shots.
- Classical result processing.
- Noise and error mitigation.

## 13.5 Information interpretation

The result may seem surprising because one oracle query returns an \(n\)-bit string. The query is not a classical one-bit observation. It is a coherent unitary operation applied to a superposition, and the final interference extracts the hidden string’s structured parity information.

---

# 14. Relationship to related algorithms

## 14.1 Deutsch’s algorithm

For \(n=1\), Bernstein–Vazirani reduces to the one-bit setting of Deutsch’s algorithm. The unknown string is either 0 or 1, and the oracle function is either constant or balanced.

## 14.2 Deutsch–Jozsa algorithm

The Deutsch–Jozsa algorithm asks whether a general function is constant or balanced. Bernstein–Vazirani assumes a specific family of parity functions and identifies the complete hidden string.

Both algorithms use:

- A uniform superposition.
- A phase oracle.
- Hadamard interference.
- A single oracle query.

Their output goals differ:

- Deutsch–Jozsa returns a class label.
- Bernstein–Vazirani returns the hidden string.

## 14.3 Simon’s algorithm

Simon’s algorithm also discovers hidden structure in a Boolean function, but the hidden information is a secret period rather than a parity mask. It requires repeated oracle queries and classical linear algebra.

## 14.4 Hidden subgroup perspective

Bernstein–Vazirani is an early example of extracting a hidden algebraic structure from oracle phase information. Later algorithms, including Simon’s and Shor’s, use related principles on more complex groups.

---

# 15. Implementation and simulation

## 15.1 High-level pseudocode

```text
function BernsteinVazirani(s):
    n = length(s)
    create n input qubits in |0⟩
    create one ancilla qubit in |1⟩

    apply H to every input qubit
    apply H to the ancilla

    for each index j where s[j] == 1:
        apply CNOT(input[j], ancilla)

    apply H to every input qubit
    measure the input register
    return measured bit string
```

## 15.2 Oracle construction

For a known test string \(s\), construct the oracle by applying a CNOT from each selected input qubit to the ancilla. The algorithm itself does not know \(s\); the oracle provider contains that information.

For example, if \(s=0101\), apply CNOTs from input qubits 1 and 3:

```text
x0: ──────────────
x1: ──●───────────
      │
x2: ──────────────
x3: ─────●────────
        │
ancilla: ─X──X────
```

## 15.3 Simulator workflow

1. Select a hidden string.
2. Create \(n\) input qubits and one ancilla.
3. Prepare the input and ancilla states.
4. Build the parity oracle.
5. Apply the final Hadamard layer.
6. Measure the input register.
7. Compare the result with the selected hidden string.

## 15.4 Testing all hidden strings

For a small \(n\), test every possible hidden string:

\[
0^n,0^{n-1}1,\ldots,1^n.
\]

For each string, verify that the measured result matches the oracle’s hidden string.

## 15.5 Noisy execution

On a noisy backend, execute many shots and calculate

\[
\hat P(s)=\frac{N_s}{N},
\]

where \(N_s\) is the count of the correct hidden string.

The success probability may be reduced by:

- Input Hadamard errors.
- CNOT errors in the oracle.
- Ancilla preparation errors.
- Final Hadamard errors.
- Readout errors.
- Decoherence.

---

# 16. Common misconceptions

## Misconception 1: The oracle reveals the hidden string directly

The oracle only computes parity values. The hidden string is recovered by the full quantum circuit and final interference.

## Misconception 2: The oracle returns all function values as classical data

The oracle acts coherently on a superposition. It does not create a classical list of all function outputs available for direct inspection.

## Misconception 3: One query violates the classical information limit

A quantum query is a unitary operation on amplitudes, not a single classical bit readout. The structured parity family permits the phase information to be decoded in one final measurement.

## Misconception 4: The ancilla stores the answer

The ancilla supports phase kickback. The hidden string appears in the input register after the final Hadamard layer.

## Misconception 5: Any Boolean function can be solved this way

Bernstein–Vazirani assumes the function has the specific form

\[
f_s(x)=s\cdot x\pmod2.
\]

An arbitrary Boolean function need not encode a single hidden string.

## Misconception 6: The algorithm is exponentially faster than classical computation

The algorithm gives a linear query advantage, \(n\) queries versus 1. The exponential speedup belongs to neither the standard Bernstein–Vazirani query comparison nor its ordinary circuit size.

## Misconception 7: Noise changes the mathematical answer

Noise changes the observed distribution, not the ideal algorithmic relationship. In the ideal model, the output is exactly \(s\).

---

# 17. Chapter summary

The Bernstein–Vazirani algorithm identifies a hidden \(n\)-bit string \(s\) from oracle access to the parity function

\[
f_s(x)=s\cdot x\pmod2.
\]

A deterministic classical algorithm queries each standard basis vector and requires \(n\) queries:

\[
D(f_s)=n.
\]

The quantum algorithm uses one query:

\[
Q(f_s)=1.
\]

The reversible oracle is

\[
U_s|x\rangle|y\rangle
=|x\rangle|y\oplus(s\cdot x)\rangle.
\]

Preparing the ancilla in \(|-\rangle\) produces phase kickback:

\[
U_s|x\rangle|-\rangle
=(-1)^{s\cdot x}|x\rangle|-\rangle.
\]

After the first Hadamard layer and oracle, the input register is in the parity-phase state

\[
\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{s\cdot x}|x\rangle.
\]

The final Hadamard transform maps this state to

\[
|s\rangle.
\]

Therefore, one ideal measurement returns the hidden string exactly. The algorithm demonstrates the power of structured phase encoding and establishes a linear quantum query advantage.

---

# 18. Formula sheet

Hidden parity function:

\[
f_s(x)=s\cdot x\pmod2.
\]

Binary dot product:

\[
s\cdot x=\bigoplus_{j=0}^{n-1}s_jx_j.
\]

Reversible oracle:

\[
U_s|x\rangle|y\rangle
=|x\rangle|y\oplus(s\cdot x)\rangle.
\]

Oracle self-inverse property:

\[
U_s^2=I.
\]

Phase kickback:

\[
U_s|x\rangle|-\rangle
=(-1)^{s\cdot x}|x\rangle|-\rangle.
\]

Uniform superposition:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}\sum_x|x\rangle.
\]

Post-oracle phase state:

\[
|\phi_s\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x(-1)^{s\cdot x}|x\rangle.
\]

Hadamard recovery:

\[
H^{\otimes n}|\phi_s\rangle=|s\rangle.
\]

Character orthogonality:

\[
\sum_x(-1)^{(s\oplus z)\cdot x}=2^n\delta_{s,z}.
\]

Final amplitude:

\[
A_z=\delta_{s,z}.
\]

Measurement probability:

\[
P(z)=\delta_{s,z}.
\]

Classical query complexity:

\[
D(f_s)=n.
\]

Quantum query complexity:

\[
Q(f_s)=1.
\]

---

# 19. Review questions and exercises

## Conceptual questions

1. What is the Bernstein–Vazirani problem?
2. What is the hidden string \(s\)?
3. Define the function \(f_s(x)=s\cdot x\pmod2\).
4. What is a binary dot product?
5. Why is the oracle reversible?
6. How can the oracle be constructed from CNOT gates?
7. What is the role of the ancilla qubit?
8. Explain phase kickback in this algorithm.
9. Why does the final Hadamard transform recover \(s\)?
10. What is the classical query complexity?
11. What is the quantum query complexity?
12. What information is encoded in the phase pattern?
13. How is Bernstein–Vazirani related to Deutsch’s algorithm?
14. How is it different from Deutsch–Jozsa?

## Numerical exercises

1. Calculate \(1011\cdot1101\pmod2\).
2. Calculate \(0101\cdot1110\pmod2\).
3. Write the truth table for \(s=10\).
4. Write the truth table for \(s=11\).
5. Calculate the oracle’s CNOT construction for \(s=1010\).
6. Write the phase pattern for \(s=110\) over all three-bit inputs.
7. Verify the phase state for \(s=11\).
8. Prove that \(U_s^2=I\).
9. Prove the character-orthogonality relation for one bit.
10. Calculate the classical and quantum query counts for \(n=8\), \(n=16\), and \(n=32\).

## Circuit exercises

Draw and analyze Bernstein–Vazirani circuits for:

1. \(s=0\).
2. \(s=1\).
3. \(s=10\).
4. \(s=11\).
5. \(s=101\).
6. \(s=1011\).
7. A general string \(s=s_0s_1\cdots s_{n-1}\).

For each circuit:

- Mark which input qubits control CNOT gates.
- Write the phase oracle.
- Apply the final Hadamard transformation.
- Predict the measured hidden string.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement the oracle for an arbitrary hidden string.
2. Run Bernstein–Vazirani for every two-bit hidden string.
3. Extend the test to three and four bits.
4. Verify that one ideal shot returns the hidden string.
5. Add a noise model and calculate the correct-output probability.
6. Compare circuit depth for different numbers of 1 bits in \(s\).
7. Compare the quantum implementation with the classical basis-query method.
8. Display the phase state before the final Hadamard layer.

---

# 20. Glossary

**Binary dot product:** The XOR sum of pairwise products of two binary strings.

**Bernstein–Vazirani algorithm:** A quantum algorithm that identifies a hidden bit string encoded in a parity oracle using one query.

**Character:** A phase function such as \((-1)^{s\cdot x}\) associated with a binary vector.

**Hidden string:** The unknown bit string that defines the oracle function.

**Parity function:** A function that returns the XOR of selected input bits.

**Phase encoding:** Representing information in the phases of quantum amplitudes.

**Query:** One application of a problem oracle.

**Walsh–Hadamard transform:** The multi-qubit transformation implemented by \(H^{\otimes n}\), which converts parity-phase patterns into basis states.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevA.54.117 "Rapid solution of problems by quantum computation"

[4]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[5]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

[6]: https://doi.org/10.1103/PhysRevLett.81.3071 "Strengths and weaknesses of quantum computing"

## Key formulas: derivation and interpretation

### Bernstein–Vazirani function

\[
f_s(x)=s\cdot x\pmod 2=\left(\sum_{i=1}^{n}s_ix_i\right)\pmod2.
\]

Here \(s\) is the hidden bit string and \(x\) is the chosen query string. The dot product is computed bitwise modulo 2.

After phase kickback and a final Hadamard transform:

\[
H^{\otimes n}\frac{1}{\sqrt{2^n}}\sum_x(-1)^{s\cdot x}|x\rangle=|s\rangle.
\]

**Derivation:** The n-fold Hadamard transform is the binary Fourier transform. Its orthogonality relation makes all strings except \(s\) cancel, leaving \(|s\rangle\). Thus one quantum query reveals all n bits.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is the hidden object in Bernstein–Vazirani?
   **Answer:** An unknown n-bit string s.

2. **Question:** What function is queried?
   **Answer:** f(x)=s·x mod 2.

3. **Question:** What does the quantum algorithm recover?
   **Answer:** The entire hidden string s with one oracle query.

4. **Question:** What operation extracts s?
   **Answer:** Hadamards and phase kickback followed by measurement.

5. **Question:** What is the classical deterministic query cost?
   **Answer:** n queries in the straightforward approach.

### Chapter quiz

1. What is the hidden object in Bernstein–Vazirani?

2. What function is queried?

3. What does the quantum algorithm recover?

4. What operation extracts s?

5. What is the classical deterministic query cost?

### Quiz answer key

1. **An unknown n-bit string s.**

2. **f(x)=s·x mod 2.**

3. **The entire hidden string s with one oracle query.**

4. **Hadamards and phase kickback followed by measurement.**

5. **n queries in the straightforward approach.**


---


# Chapter 5: Simon's Algorithm {#chapter-5-simon-s-algorithm}

## 5.1 Chapter overview

**Simon’s algorithm** is a quantum algorithm for discovering a hidden XOR period of a black-box function. It is historically important because it demonstrates an exponential separation between quantum and classical query complexity in a structured problem. It also introduced ideas that later became central to Shor’s factoring algorithm.

The problem provides a function

\[
f:\{0,1\}^n\rightarrow\{0,1\}^n
\]

with a promise that there exists a nonzero secret string

\[
s\in\{0,1\}^n,
\qquad s\neq0^n,
\]

such that

\[
f(x)=f(y)
\quad\Longleftrightarrow\quad
y=x\oplus s.
\]

The function is therefore two-to-one: every output has exactly two preimages separated by the hidden XOR period \(s\).

The goal is to determine \(s\).

A classical algorithm must find a collision \(f(x)=f(y)\) and then calculate

\[
s=x\oplus y.
\]

Finding such a collision requires exponentially many queries in the worst case, and approximately \(O(2^{n/2})\) queries for a randomized birthday-paradox strategy. Simon’s quantum algorithm uses \(O(n)\) oracle queries and classical linear algebra to recover \(s\) with high probability.

The quantum circuit repeatedly performs the following steps:

1. Prepare an \(n\)-qubit input register and an \(n\)-qubit output register.
2. Apply Hadamard gates to the input register.
3. Query the oracle once.
4. Measure or discard the output register.
5. Apply Hadamard gates to the input register.
6. Record a bit string \(y\) satisfying \(y\cdot s=0\pmod2\).
7. Repeat until enough independent equations are collected.
8. Solve the equations over \(\mathbb F_2\).

The key measurement condition is

\[
y\cdot s=0\pmod2.
\]

Each run produces a random vector orthogonal to the hidden string. A collection of independent vectors determines \(s\).

---

## 5.2 Learning objectives

After studying this chapter, learners should be able to:

1. State Simon’s promise problem.
2. Define an XOR period and a two-to-one function.
3. Explain why finding a classical collision reveals the secret string.
4. Construct Simon’s reversible oracle.
5. Follow the two-register quantum circuit.
6. Explain how measurement creates a pairwise superposition.
7. Derive the condition \(y\cdot s=0\pmod2\).
8. Collect independent linear equations from repeated runs.
9. Solve the equations over the binary field \(\mathbb F_2\).
10. Compare classical and quantum query complexity.
11. Work through a small Simon example.
12. Implement Simon’s algorithm in a quantum software framework.

---

# 6. Simon’s hidden-period problem

## 6.1 Function definition

Simon’s oracle is a function

\[
f:\{0,1\}^n\rightarrow\{0,1\}^n.
\]

Both the input and output are \(n\)-bit strings. The function is promised to have a nonzero secret string \(s\) satisfying

\[
f(x)=f(x\oplus s)
\]

for every input \(x\).

Furthermore, the promise states that these are the only collisions:

\[
f(x)=f(y)
\quad\Longleftrightarrow\quad
y=x\oplus s.
\]

## 6.2 XOR period

The string \(s\) is called an **XOR period** because adding it with XOR leaves the function unchanged:

\[
f(x)=f(x\oplus s).
\]

Unlike an ordinary integer period, this period is defined in the vector space of binary strings.

## 6.3 Two-to-one property

Every output value has exactly two inputs that produce it:

\[
x\quad\text{and}\quad x\oplus s.
\]

Because \(s\neq0^n\), these two inputs are distinct.

The input space has \(2^n\) strings, so the output range contains

\[
2^{n-1}
\]

possible function values.

## 6.4 Goal

The task is to determine the unknown nonzero string \(s\), given only oracle access to \(f\).

The algorithm does not need to reconstruct the entire function table. It needs only to identify the hidden symmetry.

---

# 7. Key definitions

## 7.1 Binary vector space

The set \(\{0,1\}^n\) can be treated as a vector space over the field with two elements,

\[
\mathbb F_2=\{0,1\}.
\]

Addition in this space is bitwise XOR.

## 7.2 XOR addition

For binary strings, addition is performed bit by bit modulo 2:

\[
0\oplus0=0,
\quad0\oplus1=1,
\quad1\oplus0=1,
\quad1\oplus1=0.
\]

## 7.3 Secret string

The **secret string** is the unknown nonzero vector \(s\) that defines the function’s hidden period.

## 7.4 Collision

A **collision** is a pair of distinct inputs \(x\neq y\) for which

\[
f(x)=f(y).
\]

Under Simon’s promise, every collision satisfies

\[
s=x\oplus y.
\]

## 7.5 Inner product over \(\mathbb F_2\)

For bit strings \(y\) and \(s\), the binary inner product is

\[
y\cdot s
=\bigoplus_{j=0}^{n-1}y_js_j.
\]

It is always either 0 or 1.

## 7.6 Orthogonality

Two binary vectors are **orthogonal over \(\mathbb F_2\)** when

\[
y\cdot s=0\pmod2.
\]

Simon’s measurements return vectors orthogonal to the hidden string.

## 7.7 Linear independence

A set of binary equations is linearly independent when no equation can be formed as an XOR combination of the others. To determine an \(n\)-bit secret, one generally needs \(n-1\) independent equations together with the known condition \(s\neq0^n\).

---

# 8. Classical solution

## 8.1 Collision-based strategy

A classical algorithm queries the function on different inputs and stores the input-output pairs. Once two inputs produce the same output,

\[
f(x)=f(y),
\]

the promise implies

\[
y=x\oplus s.
\]

Therefore,

\[
s=x\oplus y.
\]

## 8.2 Deterministic worst-case complexity

There are \(2^{n-1}\) possible output values, each with two preimages. In the worst case, a deterministic algorithm may need to query

\[
2^{n-1}+1
\]

inputs before a collision is guaranteed by the pigeonhole principle.

Thus, the deterministic query complexity is exponential:

\[
D(f)=O(2^n).
\]

More precisely, the collision guarantee occurs after at most \(2^{n-1}+1\) queries under the promise.

## 8.3 Randomized classical complexity

A randomized algorithm can sample inputs until a collision appears. Because there are approximately \(2^{n-1}\) output values, the birthday paradox suggests a collision after roughly

\[
O\left(2^{n/2}\right)
\]

queries.

This is still exponential in \(n\).

## 8.4 Classical example

Suppose the oracle produces

\[
f(001)=f(110).
\]

Then the secret string is

\[
s=001\oplus110=111.
\]

The collision reveals the hidden period immediately.

## 8.5 Limitation of classical sampling

A classical query returns one output value. The algorithm must explicitly find two inputs with the same output. The quantum algorithm instead creates a superposition of the two collision-related inputs and extracts equations about \(s\) without directly identifying a collision in every run.

---

# 9. Simon’s reversible oracle

## 9.1 Oracle definition

The quantum oracle implements

\[
U_f|x\rangle|z\rangle
=|x\rangle|z\oplus f(x)\rangle,
\]

where both \(x\) and \(z\) are \(n\)-bit strings.

If the output register begins in \(|0^n\rangle\), then

\[
U_f|x\rangle|0^n\rangle
=|x\rangle|f(x)\rangle.
\]

## 9.2 Reversibility

The input \(x\) is preserved so that the transformation is reversible. Applying the oracle twice gives

\[
U_f^2|x\rangle|z\rangle
=|x\rangle|z\oplus f(x)\oplus f(x)\rangle
=|x\rangle|z\rangle.
\]

Therefore,

\[
U_f^{-1}=U_f.
\]

## 9.3 Oracle implementation

The internal implementation depends on the function. In a query-complexity analysis, the oracle is treated as a black box. In a physical circuit, its gate count and depth must be included.

## 9.4 Oracle promise

The algorithm assumes that the oracle obeys the Simon promise. If the function has more complicated collisions or is one-to-one, the standard algorithm’s conclusion does not necessarily apply.

---

# 10. Simon’s quantum circuit

## 10.1 Circuit diagram

The circuit uses two \(n\)-qubit registers:

```text
input:  |0⟩⊗n ──H⊗n────Uf────H⊗n────M── y
output: |0⟩⊗n ──────────Uf────────────M──
```

The output register may be measured and discarded after the oracle. Only the input-register measurement is needed to obtain the linear equation.

## 10.2 Algorithm steps

For each repetition:

1. Prepare the input register in \(|0^n\rangle\).
2. Prepare the output register in \(|0^n\rangle\).
3. Apply \(H^{\otimes n}\) to the input register.
4. Apply the oracle \(U_f\).
5. Measure or ignore the output register.
6. Apply \(H^{\otimes n}\) to the input register.
7. Measure the input register and record \(y\).
8. Add the equation \(y\cdot s=0\pmod2\).
9. Repeat until enough independent equations are collected.
10. Solve the equations for the nonzero secret string.

## 10.3 State after the first Hadamard layer

The initial state is

\[
|\psi_0\rangle=|0^n\rangle|0^n\rangle.
\]

After applying Hadamards to the first register,

\[
|\psi_1\rangle
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}|x\rangle|0^n\rangle.
\]

## 10.4 State after the oracle

Applying \(U_f\) gives

\[
|\psi_2\rangle
=\frac{1}{\sqrt{2^n}}
\sum_x|x\rangle|f(x)\rangle.
\]

Because \(f(x)=f(x\oplus s)\), the terms are paired by the hidden period.

## 10.5 Measuring the output register

Suppose the output register is measured and the result is \(f(x_0)\). The input register collapses to a two-state superposition:

\[
\frac{|x_0\rangle+|x_0\oplus s\rangle}{\sqrt2}.
\]

The measurement does not reveal which of the two inputs occurred. It leaves a coherent superposition of the two collision-related inputs.

## 10.6 Final Hadamard layer

Applying \(H^{\otimes n}\) to the input state gives

\[
\frac{1}{\sqrt2}
\left(H^{\otimes n}|x_0\rangle
+H^{\otimes n}|x_0\oplus s\rangle\right).
\]

Using

\[
H^{\otimes n}|x\rangle
=\frac{1}{\sqrt{2^n}}
\sum_y(-1)^{x\cdot y}|y\rangle,
\]

we obtain

\[
\frac{1}{\sqrt{2^{n+1}}}
\sum_y
\left[(-1)^{x_0\cdot y}
+(-1)^{(x_0\oplus s)\cdot y}\right]|y\rangle.
\]

Factor the second term:

\[
(-1)^{(x_0\oplus s)\cdot y}
=(-1)^{x_0\cdot y}(-1)^{s\cdot y}.
\]

The amplitude becomes proportional to

\[
1+(-1)^{s\cdot y}.
\]

This is zero when \(s\cdot y=1\) and nonzero when \(s\cdot y=0\).

Therefore, every measured vector satisfies

\[
y\cdot s=0\pmod2.
\]

---

# 11. Mathematical derivation

## 11.1 Pair-state derivation

After measuring the output register, the input state has the form

\[
|\phi\rangle
=\frac{|x\rangle+|x\oplus s\rangle}{\sqrt2}.
\]

Apply the Hadamard transform:

\[
H^{\otimes n}|\phi\rangle
=\frac{1}{\sqrt2}
\left(H^{\otimes n}|x\rangle
+H^{\otimes n}|x\oplus s\rangle\right).
\]

Using the basis-state transform,

\[
H^{\otimes n}|x\rangle
=\frac{1}{\sqrt{2^n}}
\sum_y(-1)^{x\cdot y}|y\rangle,
\]

we get

\[
H^{\otimes n}|\phi\rangle
=\frac{1}{\sqrt{2^{n+1}}}
\sum_y(-1)^{x\cdot y}
\left[1+(-1)^{s\cdot y}\right]|y\rangle.
\]

## 11.2 Destructive interference

If

\[
s\cdot y=1,
\]

then

\[
1+(-1)^{s\cdot y}=1-1=0.
\]

The amplitude cancels.

If

\[
s\cdot y=0,
\]

then

\[
1+(-1)^{s\cdot y}=1+1=2.
\]

The amplitude survives.

Thus, measurement can produce only vectors from the orthogonal subspace

\[
s^\perp=\{y\in\{0,1\}^n:y\cdot s=0\}.
\]

## 11.3 Probability distribution

There are \(2^{n-1}\) vectors satisfying \(y\cdot s=0\). In the ideal algorithm, each allowed vector is uniformly likely:

\[
P(y)=
\begin{cases}
2^{-(n-1)},&y\cdot s=0,\\
0,&y\cdot s=1.
\end{cases}
\]

The observed equations are random samples from the orthogonal subspace.

## 11.4 Why repeated runs are needed

One measurement gives one equation in the unknown bits of \(s\). For example, if

\[
y=1011,
\]

then

\[
s_0\oplus s_2\oplus s_3=0.
\]

A single equation cannot determine all components of \(s\). Repeated executions produce additional equations.

## 11.5 Solving the equations

Suppose the measured vectors form the rows of a matrix \(Y\). The collected equations are

\[
Ys=0\pmod2.
\]

The goal is to find the nonzero vector in the null space of \(Y\).

When the rows have rank \(n-1\), the null space is one-dimensional and contains exactly

\[
\{0^n,s\}.
\]

The promise \(s\neq0^n\) identifies the secret string.

---

# 12. Solving over \(\mathbb F_2\)

## 12.1 Binary Gaussian elimination

The equations must be solved using arithmetic modulo 2. Addition and subtraction are both XOR.

For example, consider

\[
s_0\oplus s_2=0,
\]

\[
s_1\oplus s_2=0.
\]

The first equation gives

\[
s_0=s_2,
\]

and the second gives

\[
s_1=s_2.
\]

Since \(s\neq000\), the solution is

\[
s=111.
\]

## 12.2 Matrix form

Write each measured vector as a row:

\[
Y=
\begin{bmatrix}
 y^{(1)}_0&y^{(1)}_1&\cdots&y^{(1)}_{n-1}\\
 y^{(2)}_0&y^{(2)}_1&\cdots&y^{(2)}_{n-1}\\
 \vdots&\vdots&\ddots&\vdots
\end{bmatrix}.
\]

Then solve

\[
Ys=0\pmod2.
\]

## 12.3 Rank condition

To determine a unique nonzero secret, the collected equations should have rank

\[
\operatorname{rank}(Y)=n-1.
\]

If the rank is lower, multiple nonzero strings may satisfy the equations. Run the quantum circuit again to collect another independent equation.

## 12.4 Example of elimination

Suppose measured vectors are

\[
y^{(1)}=1100,
\qquad
 y^{(2)}=0110,
\qquad
 y^{(3)}=0011.
\]

The equations are

\[
s_0\oplus s_1=0,
\]

\[
s_1\oplus s_2=0,
\]

\[
s_2\oplus s_3=0.
\]

Therefore,

\[
s_0=s_1=s_2=s_3.
\]

The nonzero solution is

\[
s=1111.
\]

## 12.5 Classical post-processing

The quantum computer supplies the equations. A classical computer performs Gaussian elimination. This is a standard hybrid structure:

\[
\text{quantum sampling}
\rightarrow
\text{classical linear algebra}.
\]

---

# 13. Worked examples

## 13.1 Three-bit secret \(s=101\)

Suppose the secret is

\[
s=101.
\]

The allowed measurement vectors satisfy

\[
y\cdot s=y_0\oplus y_2=0.
\]

Thus, \(y_0=y_2\). The possible measurement outcomes are

\[
000,
\quad010,
\quad101,
\quad111.
\]

The vector 000 gives no useful equation. Suppose the algorithm returns

\[
y^{(1)}=010,
\qquad y^{(2)}=101.
\]

The equations are

\[
s_1=0,
\]

and

\[
s_0\oplus s_2=0.
\]

The nonzero solutions include 101, and the secret is recovered.

## 13.2 Three-bit secret \(s=111\)

The condition is

\[
y_0\oplus y_1\oplus y_2=0.
\]

Allowed vectors include

\[
000,
\quad011,
\quad101,
\quad110.
\]

Suppose the measurements return 011 and 101. Then

\[
s_1\oplus s_2=0,
\]

\[
s_0\oplus s_2=0.
\]

The nonzero solution is

\[
s=111.
\]

## 13.3 Collision example

Suppose a classical oracle table contains

\[
f(0101)=f(1010).
\]

Then

\[
s=0101\oplus1010=1111.
\]

Simon’s quantum algorithm does not need to explicitly observe this collision in every run. Instead, it generates equations that are consistent with the same secret.

## 13.4 Four-bit example

Let

\[
s=1100.
\]

The allowed measurement vectors satisfy

\[
y_0\oplus y_1=0.
\]

Possible outputs include

\[
0000,\quad0010,\quad0001,\quad0011,
\]

and other vectors whose first two bits are equal. After collecting independent rows, the equations determine

\[
s=1100.
\]

## 13.5 Measurement counts

For \(n=3\) and \(s=111\), the allowed vectors are 000, 011, 101, and 110. In an ideal uniform distribution, each appears with probability

\[
\frac14.
\]

A 1,000-shot experiment may produce approximately

```text
000 : 248
011 : 251
101 : 246
110 : 255
```

The zero vector is valid but provides no new information, so additional shots may be required.

---

# 14. Query complexity and speedup

## 14.1 Classical complexity

A deterministic classical algorithm may require

\[
2^{n-1}+1
\]

queries to guarantee a collision. A randomized algorithm typically requires approximately

\[
O(2^{n/2})
\]

queries due to the birthday paradox.

## 14.2 Quantum complexity

Simon’s algorithm requires a number of oracle queries that is linear in \(n\), usually written as

\[
O(n).
\]

The algorithm needs enough repetitions to collect \(n-1\) independent equations, with additional repetitions to account for dependent or zero vectors.

## 14.3 Exponential separation

The comparison is approximately

\[
O(2^{n/2})\quad\text{classical randomized}
\]

versus

\[
O(n)\quad\text{quantum}.
\]

This is an exponential query-complexity separation.

## 14.4 Success probability

The probability of collecting a full-rank set of equations increases with the number of repetitions. In practice, one runs the circuit until the matrix of collected vectors has rank \(n-1\), then solves for the nonzero null-space vector.

The exact number of repetitions is probabilistic, but it is polynomial in \(n\) with high probability.

## 14.5 Practical resource analysis

A complete implementation must include:

- Number of oracle calls.
- Oracle gate count.
- Oracle circuit depth.
- Number of qubits, approximately \(2n\).
- Measurement repetitions.
- Classical Gaussian-elimination cost.
- Noise and error-mitigation overhead.

The query separation does not mean that every physical implementation immediately has an exponential wall-clock advantage.

---

# 15. Relationship to other algorithms

## 15.1 Deutsch–Jozsa

Deutsch–Jozsa distinguishes constant and balanced functions. Simon’s algorithm identifies a hidden XOR period. Both use Hadamard transforms and interference, but Simon’s algorithm requires repeated measurements and classical equation solving.

## 15.2 Bernstein–Vazirani

Bernstein–Vazirani recovers a hidden parity mask in one query. Simon’s algorithm recovers a hidden period by collecting vectors orthogonal to that period. Both use binary linear structure.

## 15.3 Shor’s algorithm

Simon’s algorithm is an important conceptual predecessor of Shor’s algorithm. Both:

- Find hidden periodic structure.
- Use quantum superposition.
- Measure information satisfying orthogonality or Fourier constraints.
- Use classical post-processing to recover the hidden structure.

Simon’s problem uses the group \((\mathbb Z_2)^n\), while Shor’s algorithm uses periodicity in modular arithmetic.

## 15.4 Hidden-subgroup viewpoint

Simon’s promise defines a subgroup

\[
H=\{0^n,s\}
\]

of the binary vector space. The function is constant on cosets of this subgroup. The quantum algorithm samples vectors in the orthogonal subgroup and reconstructs \(H\).

---

# 16. Implementation and simulation

## 16.1 High-level pseudocode

```text
function Simon(f, n):
    equations = empty list

    while rank(equations) < n - 1:
        prepare input register in |0⟩^n
        prepare output register in |0⟩^n
        apply H to input register
        apply oracle Uf
        measure or discard output register
        apply H to input register
        measure input register to obtain y

        if y is not already dependent:
            add y · s = 0 to equations

    solve equations over F2
    return the nonzero solution s
```

## 16.2 Quantum-circuit workflow

1. Create two registers of \(n\) qubits.
2. Apply H gates to the input register.
3. Implement the promised oracle.
4. Apply H gates again to the input register.
5. Measure the input register.
6. Repeat until rank \(n-1\) is reached.
7. Use a classical binary-elimination routine.

## 16.3 Handling the zero vector

The measurement \(y=0^n\) always satisfies

\[
y\cdot s=0,
\]

but it gives the trivial equation

\[
0=0.
\]

It should be recorded if desired but not counted as an independent equation.

## 16.4 Dependent equations

A nonzero measurement may still be a linear combination of previously collected rows. Compute the rank after each measurement. Continue running the circuit until the rank reaches \(n-1\).

## 16.5 Noise considerations

Noise can produce an invalid vector that does not satisfy the true equation. Practical strategies include:

- Repeating measurements.
- Validating candidate secrets against the oracle on selected inputs.
- Using error mitigation.
- Solving an overdetermined system and selecting the best-supported solution.
- Comparing the recovered secret with classical test cases.

## 16.6 Classical verification

After finding a candidate \(\hat s\), verify it by checking whether sampled collisions or oracle evaluations are consistent with

\[
f(x)=f(x\oplus\hat s).
\]

Verification is important when the circuit is noisy.

---

# 17. Common misconceptions

## Misconception 1: Simon’s algorithm directly measures the secret string

Each run returns a vector \(y\) satisfying \(y\cdot s=0\). The secret is reconstructed from several such equations.

## Misconception 2: Every measured vector is different

Measurements may return the zero vector or vectors that are linearly dependent. Repetition is needed until the collected equations have sufficient rank.

## Misconception 3: The output register contains the secret

The output register contains function values. The secret is recovered from the input-register measurement equations.

## Misconception 4: A collision must be measured by the quantum computer

The algorithm creates a superposition of collision-related inputs after output measurement. It extracts orthogonality information without requiring a directly observed collision in each run.

## Misconception 5: The function can be arbitrary

Simon’s algorithm relies on the two-to-one XOR-period promise. Without the promise, the standard conclusion may fail.

## Misconception 6: The classical complexity is exactly \(2^n\) in every model

A deterministic collision guarantee is on the order of \(2^{n-1}\), while a randomized birthday strategy takes approximately \(2^{n/2}\). Both are exponential, whereas the quantum query count is linear.

## Misconception 7: Solving the equations uses ordinary integer arithmetic

The equations must be solved over \(\mathbb F_2\), where addition is XOR and all arithmetic is modulo 2.

## Misconception 8: The quantum speedup ignores classical computation

Classical linear algebra is part of the algorithm. The speedup comes from obtaining the equations efficiently through quantum queries.

---

# 18. Chapter summary

Simon’s algorithm solves a hidden-period problem for a promised two-to-one function

\[
f:\{0,1\}^n\rightarrow\{0,1\}^n
\]

with a nonzero secret string \(s\) satisfying

\[
f(x)=f(x\oplus s).
\]

A classical algorithm must find a collision and calculate

\[
s=x\oplus y,
\]

requiring exponentially many queries in the randomized setting.

Simon’s quantum algorithm uses two \(n\)-qubit registers. After creating a superposition and querying the oracle, measurement and interference produce a vector \(y\) satisfying

\[
y\cdot s=0\pmod2.
\]

Repeated executions provide enough independent equations to solve

\[
Ys=0\pmod2.
\]

When the equation matrix has rank \(n-1\), its nonzero null-space vector is the secret string.

The quantum query complexity is

\[
O(n),
\]

compared with approximately

\[
O(2^{n/2})
\]

randomized classical queries. This exponential query separation and its hidden-subgroup structure make Simon’s algorithm an important predecessor to Shor’s algorithm.

---

# 19. Formula sheet

Simon promise:

\[
f(x)=f(x\oplus s).
\]

Collision condition:

\[
f(x)=f(y)\Longleftrightarrow y=x\oplus s.
\]

Secret from a collision:

\[
s=x\oplus y.
\]

Binary inner product:

\[
y\cdot s=\bigoplus_{j=0}^{n-1}y_js_j.
\]

Simon oracle:

\[
U_f|x\rangle|z\rangle
=|x\rangle|z\oplus f(x)\rangle.
\]

Hadamard basis transform:

\[
H^{\otimes n}|x\rangle
=\frac1{\sqrt{2^n}}\sum_y(-1)^{x\cdot y}|y\rangle.
\]

Measurement condition:

\[
y\cdot s=0\pmod2.
\]

Allowed-vector probability:

\[
P(y)=
\begin{cases}
2^{-(n-1)},&y\cdot s=0,\\
0,&y\cdot s=1.
\end{cases}
\]

Equation system:

\[
Ys=0\pmod2.
\]

Rank condition:

\[
\operatorname{rank}(Y)=n-1.
\]

Deterministic classical query scale:

\[
O(2^n).
\]

Randomized classical collision scale:

\[
O(2^{n/2}).
\]

Quantum query scale:

\[
O(n).
\]

---

# 20. Review questions and exercises

## Conceptual questions

1. State Simon’s problem.
2. What is an XOR period?
3. Why is the function two-to-one?
4. What is a collision?
5. How can a classical collision reveal \(s\)?
6. What is the reversible oracle transformation?
7. Why are two \(n\)-qubit registers used?
8. What state is created by the first Hadamard layer?
9. Why does output-register measurement create a pairwise superposition?
10. What condition does the input-register measurement satisfy?
11. Why are repeated runs necessary?
12. Why is Gaussian elimination performed over \(\mathbb F_2\)?
13. What rank is needed to determine the nonzero secret uniquely?
14. How does Simon’s algorithm relate to Shor’s algorithm?

## Numerical exercises

1. Calculate \(0011\oplus1101\).
2. If \(x=0101\) and \(y=1010\) collide, calculate \(s\).
3. Calculate \(y\cdot s\) for \(y=1011\) and \(s=1101\).
4. List all vectors orthogonal to \(s=111\).
5. Solve the equations
   \[
   s_0\oplus s_1=0,
   \qquad
   s_1\oplus s_2=0.
   \]
6. Solve the system represented by rows 1100, 0110, and 0011.
7. Determine whether the rows 101, 011, and 110 are linearly independent over \(\mathbb F_2\).
8. Calculate the deterministic collision-guarantee scale for \(n=5\).
9. Estimate the randomized birthday-query scale for \(n=20\).
10. Explain why the zero vector is not a useful independent equation.

## Circuit exercises

Draw and analyze Simon circuits for:

1. A two-bit secret \(s=01\).
2. A two-bit secret \(s=11\).
3. A three-bit secret \(s=101\).
4. A four-bit secret \(s=1100\).
5. A function whose collision pair is \(x\) and \(x\oplus s\).

For each circuit:

- Prepare both registers.
- Apply the first Hadamard layer.
- Apply the oracle.
- Explain the pairwise state after output measurement.
- Apply the final Hadamard layer.
- Derive the equation satisfied by the measured vector.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Create a small two-to-one Simon oracle.
2. Run the circuit repeatedly and collect measured vectors.
3. Remove zero and dependent equations.
4. Solve the remaining equations over \(\mathbb F_2\).
5. Verify the recovered secret against the oracle.
6. Test secrets of length 3, 4, and 5.
7. Add a noise model and study invalid equation rates.
8. Compare the number of oracle calls with a classical collision search.

---

# 21. Glossary

**Binary inner product:** The XOR sum of bitwise products of two binary vectors.

**Collision:** Two distinct inputs that produce the same function output.

**Hidden period:** A nonzero string that leaves the function unchanged under XOR.

**Null space:** The set of vectors mapped to zero by a matrix; in Simon’s problem it contains the secret string.

**Orthogonal subspace:** The set of vectors \(y\) satisfying \(y\cdot s=0\).

**Simon’s algorithm:** A quantum algorithm that finds the hidden XOR period of a promised two-to-one function.

**Two-to-one function:** A function in which each output has exactly two preimages.

**XOR period:** A binary vector \(s\) satisfying \(f(x)=f(x\oplus s)\).

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevA.52.2493 "On the power of quantum computation"

[4]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[5]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

[6]: https://doi.org/10.1103/PhysRevLett.81.3071 "Strengths and weaknesses of quantum computing"

## Key formulas: derivation and interpretation

### Simon’s promise

\[
f(x)=f(x\oplus s),\qquad s\ne0.
\]

The hidden string \(s\) is the period. After querying the oracle and measuring the output register, the input register is related to a pair \(x\) and \(x\oplus s\). Applying Hadamards produces samples \(y\) satisfying:

\[
y\cdot s=0\pmod2.
\]

**Derivation:** The two inputs contribute phases \((-1)^{x\cdot y}\) and \((-1)^{(x\oplus s)\cdot y}\). Their sum is nonzero only when \(s\cdot y=0\) modulo 2. Repeating the experiment yields independent linear equations, which are solved over GF(2) to obtain \(s\).


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is Simon’s promise?
   **Answer:** There is a nonzero secret string s such that f(x)=f(x⊕s).

2. **Question:** What is s called?
   **Answer:** The hidden period or secret string.

3. **Question:** What equations are obtained?
   **Answer:** y·s=0 mod 2.

4. **Question:** How are equations solved?
   **Answer:** By collecting independent measurement samples and using linear algebra over GF(2).

5. **Question:** What is the speedup type?
   **Answer:** Exponential query speedup compared with deterministic classical query complexity.

### Chapter quiz

1. What is Simon’s promise?

2. What is s called?

3. What equations are obtained?

4. How are equations solved?

5. What is the speedup type?

### Quiz answer key

1. **There is a nonzero secret string s such that f(x)=f(x⊕s).**

2. **The hidden period or secret string.**

3. **y·s=0 mod 2.**

4. **By collecting independent measurement samples and using linear algebra over GF(2).**

5. **Exponential query speedup compared with deterministic classical query complexity.**


---


# Chapter 6: Grover's Search Algorithm {#chapter-6-grover-s-search-algorithm}

## 6.1 Chapter overview

**Grover’s Search Algorithm** is a quantum algorithm for searching an unstructured space of possible candidates. It provides a quadratic query speedup over classical exhaustive search.

Suppose there are \(N\) possible items and exactly one item is marked as the desired solution. A classical algorithm may need \(O(N)\) oracle queries in the worst case. Grover’s algorithm finds the marked item using approximately

\[
O(\sqrt N)
\]

queries.

The algorithm does not examine the candidates one at a time. Instead, it uses:

- A uniform superposition over all candidates.
- A phase oracle that marks the desired state.
- A diffusion operator that amplifies the marked amplitude.
- Repeated Grover iterations.
- Measurement and classical verification.

One Grover iteration is

\[
G=DO,
\]

where:

- \(O\) is the oracle.
- \(D\) is the diffusion or inversion-about-the-mean operator.

The approximate optimal number of iterations for one marked item is

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

The speedup is quadratic rather than exponential. Grover’s algorithm is important because it applies to any problem that can be expressed as an efficiently implementable unstructured search oracle. It is also the foundation of the more general technique called **amplitude amplification**.

---

## 6.2 Learning objectives

After studying this chapter, learners should be able to:

1. State the unstructured-search problem.
2. Define a marked state and a search oracle.
3. Explain how the initial uniform superposition is prepared.
4. Describe phase marking by the oracle.
5. Derive the diffusion operator.
6. Explain inversion about the mean.
7. Analyze one Grover iteration.
8. Derive the geometric rotation picture.
9. Calculate the approximate number of iterations.
10. Explain why too many iterations reduce success probability.
11. Compare classical and quantum query complexity.
12. Implement and test Grover’s algorithm on a simulator.
13. Explain the effect of multiple marked items.
14. Discuss oracle cost, noise, and practical limitations.

---

# 7. The unstructured-search problem

## 7.1 Search space

Let the search space contain \(N\) candidates:

\[
\{0,1,2,\ldots,N-1\}.
\]

For a register of \(n\) qubits,

\[
N=2^n.
\]

Each computational-basis state \(|x\rangle\) represents one candidate.

## 7.2 Marked state

A **marked state** is a candidate that satisfies the search condition. Let \(x^*\) denote the unique marked item. The objective is to output \(x^*\).

The search predicate can be written as

\[
f(x)=
\begin{cases}
1,&x=x^*,\\
0,&x\neq x^*.
\end{cases}
\]

## 7.3 Classical search

A classical exhaustive search tests candidates one by one. In the worst case, it checks all \(N\) candidates:

\[
T_{\text{classical}}=O(N).
\]

If the marked item is uniformly distributed, the expected number of tests is approximately

\[
\frac{N+1}{2}.
\]

## 7.4 Quantum search

Grover’s algorithm uses the structure of quantum amplitudes to increase the probability of the marked state. It requires approximately

\[
T_{\text{quantum}}=O(\sqrt N)
\]

oracle queries.

The algorithm does not provide a way to read every candidate simultaneously. The speedup comes from repeatedly amplifying the marked amplitude through interference.

---

# 8. Key definitions

## 8.1 Unstructured search

**Unstructured search** is a search problem in which the candidates have no exploitable ordering or organization. The algorithm can determine whether a candidate is valid only by evaluating a predicate or oracle.

## 8.2 Oracle

A **search oracle** is a reversible operation that identifies a marked state. In phase-oracle form,

\[
O|x\rangle=(-1)^{f(x)}|x\rangle.
\]

The marked state receives a phase of \(-1\), while unmarked states remain unchanged.

## 8.3 Marked state

A **marked state** is a basis state satisfying the search condition. In the single-solution case, the marked subspace is spanned by \(|x^*\rangle\).

## 8.4 Diffusion operator

The **diffusion operator** reflects amplitudes about their average. It is also called the inversion-about-the-mean operator:

\[
D=2|s\rangle\langle s|-I,
\]

where \(|s\rangle\) is the uniform superposition.

## 8.5 Amplitude amplification

**Amplitude amplification** is the process of increasing the amplitudes of desired states while decreasing the amplitudes of undesired states through repeated reflections.

## 8.6 Grover iteration

A **Grover iteration** is the product of the oracle and diffusion operator:

\[
G=DO.
\]

One iteration first marks the desired states and then amplifies them.

## 8.7 Query complexity

**Query complexity** counts the number of oracle applications. Grover’s algorithm requires \(O(\sqrt N)\) queries for one marked item, which is optimal in the black-box model.

---

# 9. Preparing the uniform superposition

## 9.1 Initial state

Start with \(n\) qubits in

\[
|0\rangle^{\otimes n}.
\]

Apply a Hadamard gate to every qubit:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt N}\sum_{x=0}^{N-1}|x\rangle.
\]

Define

\[
|s\rangle
=\frac{1}{\sqrt N}\sum_{x=0}^{N-1}|x\rangle.
\]

Every candidate initially has equal amplitude

\[
\frac{1}{\sqrt N}
\]

and probability

\[
\frac{1}{N}.
\]

## 9.2 Why equal amplitudes are useful

The uniform state treats all candidates symmetrically. The oracle introduces a difference by changing the phase of the marked state. The diffusion operator then converts this phase difference into amplitude growth.

## 9.3 Circuit preparation

```text
q0: ──H──
q1: ──H──
⋮
q(n-1):─H──
```

After this layer, the register represents all \(N\) candidates in superposition.

---

# 10. The phase oracle

## 10.1 Oracle definition

For a single marked state \(x^*\), the phase oracle is

\[
O|x\rangle=
\begin{cases}
-|x\rangle,&x=x^*,\\
|x\rangle,&x\neq x^*.
\end{cases}
\]

Equivalently,

\[
O=I-2|x^*\rangle\langle x^*|.
\]

## 10.2 Oracle acting on the uniform state

Before the oracle,

\[
|s\rangle
=\frac{1}{\sqrt N}
\left(|x^*\rangle+\sum_{x\neq x^*}|x\rangle\right).
\]

After the oracle,

\[
O|s\rangle
=\frac{1}{\sqrt N}
\left(-|x^*\rangle+\sum_{x\neq x^*}|x\rangle\right).
\]

The marked amplitude changes from

\[
\frac{1}{\sqrt N}
\]

to

\[
-\frac{1}{\sqrt N}.
\]

Its probability has not yet increased. The oracle only changes its phase.

## 10.3 Boolean oracle with an ancilla

A reversible function oracle may be written as

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

If the ancilla is prepared in \(|-\rangle\), phase kickback gives

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

Thus, the phase oracle can be implemented using a standard reversible oracle and an ancilla.

## 10.4 Oracle cost

In theoretical query analysis, one oracle call is treated as one unit. In practice, the oracle must be decomposed into gates. Its construction may dominate the total cost.

---

# 11. The diffusion operator

## 11.1 Definition

The diffusion operator is

\[
D=2|s\rangle\langle s|-I.
\]

It reflects a state about the uniform state \(|s\rangle\).

Because \(|s\rangle\) is normalized,

\[
D^2=I.
\]

It is therefore a reflection and a unitary operation.

## 11.2 Inversion about the mean

Suppose the amplitudes before diffusion are \(a_0,a_1,\ldots,a_{N-1}\), with mean

\[
\bar a=\frac{1}{N}\sum_{x=0}^{N-1}a_x.
\]

The diffusion operator transforms each amplitude according to

\[
a_x' = 2\bar a-a_x.
\]

An amplitude below the mean becomes larger, while an amplitude above the mean becomes smaller.

## 11.3 Circuit decomposition

The diffusion operator can be implemented as

\[
D=H^{\otimes n}(2|0^n\rangle\langle0^n|-I)H^{\otimes n}.
\]

The central reflection can be implemented using a multi-controlled phase operation:

```text
input: ──H⊗n──X⊗n──multi-controlled-Z──X⊗n──H⊗n──
```

The exact gate decomposition depends on the hardware and available native operations.

## 11.4 Diffusion after phase marking

The oracle makes the marked amplitude negative. Relative to the average, it is now below the other amplitudes. The diffusion reflection turns this negative deviation into a positive amplified amplitude.

---

# 12. One Grover iteration

## 12.1 Definition

One Grover iteration is

\[
G=DO.
\]

The order matters:

1. Apply the oracle \(O\).
2. Apply the diffusion operator \(D\).

## 12.2 Qualitative behavior

Starting from the uniform state:

1. All amplitudes are equal.
2. The oracle flips the marked amplitude.
3. The mean amplitude changes slightly.
4. Diffusion reflects every amplitude about the mean.
5. The marked amplitude becomes larger than before.
6. Unmarked amplitudes become smaller.

Repeating the iteration increases the marked-state probability until it reaches a maximum.

## 12.3 Two-dimensional subspace

Although the full state space has dimension \(N\), Grover’s algorithm evolves in a two-dimensional subspace spanned by:

- The marked state \(|w\rangle=|x^*\rangle\).
- The normalized superposition of unmarked states \(|r\rangle\).

Define

\[
|r\rangle
=\frac{1}{\sqrt{N-1}}
\sum_{x\neq x^*}|x\rangle.
\]

The uniform state can be written as

\[
|s\rangle
=\frac{1}{\sqrt N}|w\rangle
+\sqrt{\frac{N-1}{N}}|r\rangle.
\]

## 12.4 Initial angle

Define an angle \(\theta\) by

\[
\sin\theta=\frac{1}{\sqrt N},
\qquad
\cos\theta=\sqrt{\frac{N-1}{N}}.
\]

Then

\[
|s\rangle
=\sin\theta|w\rangle+\cos\theta|r\rangle.
\]

## 12.5 Rotation per iteration

The oracle reflection and diffusion reflection combine to rotate the state toward \(|w\rangle\) by angle

\[
2\theta
\]

per Grover iteration.

After \(k\) iterations,

\[
G^k|s\rangle
=\sin((2k+1)\theta)|w\rangle
+\cos((2k+1)\theta)|r\rangle.
\]

Therefore, the success probability is

\[
P_k=\sin^2((2k+1)\theta).
\]

---

# 13. Optimal number of iterations

## 13.1 Single marked item

The success probability is maximized when

\[
(2k+1)\theta\approx\frac{\pi}{2}.
\]

Solving for \(k\),

\[
k\approx\frac{\pi}{4\theta}-\frac12.
\]

For large \(N\), \(\theta\approx1/\sqrt N\), so

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

The integer closest to this value is used in practice.

## 13.2 Examples

For \(N=4\),

\[
\frac{\pi}{4}\sqrt4=\frac{\pi}{2}\approx1.57,
\]

so one or two iterations may be tested depending on the exact success probability.

For \(N=16\),

\[
\frac{\pi}{4}\sqrt{16}=\pi\approx3.14,
\]

so approximately three iterations are used.

For \(N=64\),

\[
\frac{\pi}{4}\sqrt{64}=2\pi\approx6.28,
\]

so approximately six iterations are used.

## 13.3 Too many iterations

Grover iterations perform a rotation. After the state passes the marked direction, additional iterations reduce the marked-state probability. This is called **over-rotation**.

The algorithm is therefore not improved by running indefinitely.

## 13.4 Unknown number of solutions

If the number of marked items is unknown, the optimal iteration count is also unknown. Strategies include:

- Randomizing the number of iterations.
- Using quantum counting.
- Applying adaptive amplitude amplification.
- Estimating the marked fraction first.

---

# 14. Multiple marked states

## 14.1 Marked fraction

Suppose there are \(M\) marked states among \(N\) candidates. Define

\[
\sin^2\theta=\frac{M}{N}.
\]

The initial state decomposes as

\[
|s\rangle
=\sin\theta|w\rangle+\cos\theta|r\rangle,
\]

where \(|w\rangle\) is the uniform superposition of marked states and \(|r\rangle\) is the uniform superposition of unmarked states.

## 14.2 Iteration count

The optimal number of iterations becomes approximately

\[
k\approx\frac{\pi}{4}\sqrt{\frac{N}{M}}.
\]

The query complexity is

\[
O\left(\sqrt{\frac{N}{M}}\right).
\]

## 14.3 Measurement result

The algorithm returns one of the marked states with high probability. If several solutions are acceptable, measurement selects one according to the final distribution.

---

# 15. Mathematical examples

## 15.1 Two-qubit search

Let \(N=4\) and suppose \(|11\rangle\) is marked. The initial state is

\[
|s\rangle=\frac{|00\rangle+|01\rangle+|10\rangle+|11\rangle}{2}.
\]

The oracle produces

\[
O|s\rangle
=\frac{|00\rangle+|01\rangle+|10\rangle-|11\rangle}{2}.
\]

The mean amplitude is

\[
\bar a=\frac{1/2+1/2+1/2-1/2}{4}=\frac14.
\]

After inversion about the mean,

\[
a_{\text{unmarked}}'=2\left(\frac14\right)-\frac12=0,
\]

and

\[
a_{\text{marked}}'=2\left(\frac14\right)-\left(-\frac12\right)=1.
\]

The final state is

\[
|11\rangle.
\]

This small case finds the marked item with certainty after one iteration.

## 15.2 Four-state amplitude table

For the same example:

| State | Before oracle | After oracle | After diffusion |
|---|---:|---:|---:|
| 00 | \(1/2\) | \(1/2\) | 0 |
| 01 | \(1/2\) | \(1/2\) | 0 |
| 10 | \(1/2\) | \(1/2\) | 0 |
| 11 | \(1/2\) | \(-1/2\) | 1 |

The probability of \(|11\rangle\) changes from \(1/4\) to 1.

## 15.3 Eight-state search

For \(N=8\), the initial marked amplitude is

\[
\frac{1}{\sqrt8}\approx0.3536.
\]

The initial success probability is

\[
\frac18=0.125.
\]

The approximate iteration count is

\[
k\approx\frac{\pi}{4}\sqrt8\approx2.22.
\]

Two iterations are typically used, followed by measurement.

## 15.4 Multiple solutions

Let \(N=16\) and \(M=4\). Then

\[
k\approx\frac{\pi}{4}\sqrt{\frac{16}{4}}
=\frac{\pi}{2}\approx1.57.
\]

Approximately one or two iterations can amplify the marked subspace.

---

# 16. Circuit implementation

## 16.1 High-level pseudocode

```text
function GroverSearch(n, oracle, iterations):
    create n search qubits in |0⟩
    apply H to all search qubits

    repeat iterations times:
        apply phase oracle
        apply diffusion operator

    measure search qubits
    classically verify the candidate
    return candidate
```

## 16.2 Standard circuit structure

```text
search: ──H⊗n──[ Oracle ── Diffusion ]×k──M──
```

If the oracle uses an ancilla:

```text
search:  ──H⊗n──Uf──Diffusion──Uf──Diffusion──M──
ancilla: ──H────Uf────────────Uf──────────────
```

The ancilla is often prepared in \(|-\rangle\) to turn a function oracle into a phase oracle.

## 16.3 Diffusion pseudocode

A typical diffusion construction is:

```text
apply H to every search qubit
apply X to every search qubit
apply multi-controlled phase flip
apply X to every search qubit
apply H to every search qubit
```

The multi-controlled phase flip changes the phase of \(|0^n\rangle\) in the transformed basis.

## 16.4 Oracle construction for a known marked bit string

For small examples, an oracle marking \(|x^*\rangle\) can be built by:

1. Apply X to qubits whose target bit in \(x^*\) is 0.
2. Apply a multi-controlled Z operation.
3. Undo the X gates.

This maps the selected basis state to the all-one control pattern for the multi-controlled phase operation.

## 16.5 Simulator workflow

1. Choose \(n\) and one or more marked states.
2. Prepare the uniform superposition.
3. Build the oracle.
4. Calculate the iteration count.
5. Apply oracle and diffusion repeatedly.
6. Measure over many shots.
7. Estimate the marked-state probability.
8. Verify the measured candidate.

---

# 17. Complexity and optimality

## 17.1 Classical complexity

Unstructured classical search requires

\[
O(N)
\]

queries in the worst case.

## 17.2 Quantum complexity

Grover’s algorithm requires

\[
O(\sqrt N)
\]

queries for one marked item.

For \(M\) marked items, the complexity is

\[
O\left(\sqrt{\frac{N}{M}}\right).
\]

## 17.3 Optimality

The quadratic speedup is asymptotically optimal in the black-box query model. No quantum algorithm can solve the general unstructured-search problem with substantially fewer than

\[
\Omega(\sqrt N)
\]

queries.

## 17.4 Total runtime

The query count is not the entire runtime. A practical implementation must include:

- Oracle gate count.
- Diffusion gate count.
- Number of iterations.
- Number of shots.
- Classical verification.
- Hardware queue and execution time.
- Error mitigation.

A complex oracle can remove the practical advantage even though the query complexity remains quadratic.

---

# 18. Noise and practical limitations

## 18.1 Error accumulation

Each Grover iteration contains an oracle and a diffusion circuit. As the iteration count grows, errors accumulate.

If the circuit is too deep, amplitude amplification may be outweighed by decoherence and gate noise.

## 18.2 Over-rotation under noise

The ideal iteration count may not be optimal on noisy hardware. Noise can reduce the peak success probability and shift the best stopping point.

## 18.3 Oracle implementation cost

The oracle may require multi-controlled gates, which are expensive to decompose into native gates. Reducing oracle depth is often more important than reducing the number of abstract Grover iterations.

## 18.4 Verification

If a candidate can be checked efficiently, classical verification should be performed after measurement. For example, evaluate the search predicate on the measured candidate.

## 18.5 Unknown solution count

When the number of marked states is unknown, fixed iteration counts may over-rotate or under-rotate. Adaptive or randomized strategies are safer.

---

# 19. Relationship to amplitude amplification

## 19.1 General setting

Suppose a quantum procedure produces a state

\[
|\psi\rangle
=\sqrt a|\text{good}\rangle
+\sqrt{1-a}|\text{bad}\rangle,
\]

where \(a\) is the initial success probability.

Amplitude amplification applies two reflections to rotate the state toward the good subspace.

## 19.2 Grover as a special case

For one marked item among \(N\),

\[
a=\frac1N.
\]

The number of iterations needed is

\[
O\left(\frac1{\sqrt a}\right)=O(\sqrt N).
\]

## 19.3 Applications

Amplitude amplification can improve:

- Search subroutines.
- Constraint satisfaction.
- Monte Carlo procedures.
- Optimization heuristics.
- Quantum backtracking.
- Randomized algorithm success probabilities.

---

# 20. Common misconceptions

## Misconception 1: Grover’s algorithm tests every item and reads all answers

It creates a superposition over candidates but extracts only a final measured candidate. The speedup comes from amplitude amplification, not direct access to all classical answers.

## Misconception 2: The speedup is exponential

Grover’s algorithm changes \(O(N)\) to \(O(\sqrt N)\), which is a quadratic speedup.

## Misconception 3: The oracle finds the answer

The oracle only marks valid candidates. The diffusion operator and repeated iterations amplify the marked amplitude.

## Misconception 4: More Grover iterations always improve the result

The state rotates through a two-dimensional space. After the optimum, additional iterations reduce the success probability.

## Misconception 5: The oracle is free

Query complexity treats oracle calls abstractly. Real implementations must build the oracle from physical gates.

## Misconception 6: Grover solves every optimization problem immediately

An optimization problem must be encoded into a search predicate or another suitable quantum formulation. Oracle construction may be difficult.

## Misconception 7: The diffusion operator measures the average classically

The inversion-about-the-mean operation is a unitary reflection. It does not measure amplitudes or compute the mean through classical observation.

## Misconception 8: Multiple solutions break the algorithm

Grover’s algorithm works with multiple marked states, but the iteration count changes to approximately

\[
\frac{\pi}{4}\sqrt{N/M}.
\]

---

# 21. Chapter summary

Grover’s Search Algorithm solves an unstructured search problem with a quadratic quantum speedup.

For \(N=2^n\) candidates, classical exhaustive search requires \(O(N)\) queries. Grover’s algorithm requires approximately

\[
O(\sqrt N)
\]

queries for one marked item.

The algorithm begins with the uniform state

\[
|s\rangle=\frac1{\sqrt N}\sum_x|x\rangle.
\]

The phase oracle marks the solution:

\[
O|x\rangle=(-1)^{f(x)}|x\rangle.
\]

The diffusion operator is

\[
D=2|s\rangle\langle s|-I.
\]

A Grover iteration is

\[
G=DO.
\]

Each iteration rotates the state toward the marked subspace by an angle related to

\[
\sin\theta=\frac1{\sqrt N}
\]

for one marked state. After \(k\) iterations,

\[
P_k=\sin^2((2k+1)\theta).
\]

The approximate optimal iteration count is

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

For \(M\) marked states, the complexity becomes

\[
O\left(\sqrt{N/M}\right).
\]

Grover’s algorithm is the fundamental example of amplitude amplification. Its practical performance depends on oracle construction, diffusion depth, noise, shot count, and classical verification.

---

# 22. Formula sheet

Search-space size:

\[
N=2^n.
\]

Uniform state:

\[
|s\rangle=\frac1{\sqrt N}\sum_{x=0}^{N-1}|x\rangle.
\]

Phase oracle:

\[
O|x\rangle=(-1)^{f(x)}|x\rangle.
\]

Single-solution oracle:

\[
O=I-2|x^*\rangle\langle x^*|.
\]

Diffusion operator:

\[
D=2|s\rangle\langle s|-I.
\]

Grover iteration:

\[
G=DO.
\]

Single marked state angle:

\[
\sin\theta=\frac1{\sqrt N}.
\]

State after \(k\) iterations:

\[
G^k|s\rangle
=\sin((2k+1)\theta)|w\rangle
+\cos((2k+1)\theta)|r\rangle.
\]

Success probability:

\[
P_k=\sin^2((2k+1)\theta).
\]

Optimal iterations for one solution:

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

Multiple-solution angle:

\[
\sin^2\theta=\frac MN.
\]

Multiple-solution complexity:

\[
O\left(\sqrt{N/M}\right).
\]

Classical complexity:

\[
O(N).
\]

Quantum complexity:

\[
O(\sqrt N).
\]

---

# 23. Review questions and exercises

## Conceptual questions

1. What is an unstructured search problem?
2. What is a marked state?
3. What does the phase oracle do?
4. What is the diffusion operator?
5. Why is diffusion called inversion about the mean?
6. Define one Grover iteration.
7. Why does Grover’s algorithm evolve in a two-dimensional subspace?
8. What is the success probability after \(k\) iterations?
9. How many iterations are needed approximately for one marked item?
10. Why can too many iterations reduce the success probability?
11. How does the iteration count change when there are \(M\) solutions?
12. What is the difference between query complexity and total runtime?
13. Why is the oracle cost important?
14. What is amplitude amplification?

## Numerical exercises

1. Calculate the number of qubits needed for \(N=32\) candidates.
2. Calculate the initial success probability for one marked item among 64.
3. Estimate the Grover iteration count for \(N=100\).
4. Estimate the iteration count for \(N=256\).
5. Calculate \(P_k\) for \(N=4\) after one iteration.
6. Calculate the number of iterations for \(N=16\) and \(M=4\).
7. If a search has 1,024 candidates, compare classical and quantum query scales.
8. Derive the diffusion amplitude update \(a_x'=2\bar a-a_x\).
9. Explain why the marked amplitude becomes larger after oracle plus diffusion.
10. Calculate the marked-state probability when \((2k+1)\theta=\pi/2\).

## Circuit exercises

Draw and analyze Grover circuits for:

1. A two-qubit search marking \(|00\rangle\).
2. A two-qubit search marking \(|11\rangle\).
3. A three-qubit search marking \(|101\rangle\).
4. A search with two marked states.
5. A phase oracle implemented with an ancilla in \(|-\rangle\).
6. A complete diffusion circuit.

For each circuit:

- Prepare the uniform state.
- Apply the oracle.
- Calculate the amplitudes after the oracle.
- Apply diffusion.
- Calculate the marked-state probability.
- Determine the recommended iteration count.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement a two-qubit Grover search.
2. Mark each of the four possible states in separate experiments.
3. Implement the diffusion operator.
4. Plot success probability versus iteration count.
5. Compare one, two, and three Grover iterations.
6. Extend the search to three qubits.
7. Implement multiple marked states.
8. Add a noise model and measure the reduction in success probability.
9. Compare oracle gate depth with total circuit depth.
10. Verify each measured candidate classically.

---

# 24. Glossary

**Amplitude amplification:** A quantum technique that increases the amplitude of desired states.

**Diffusion operator:** A reflection about the uniform superposition, also called inversion about the mean.

**Grover iteration:** The combined operation \(G=DO\) consisting of an oracle and diffusion step.

**Marked state:** A candidate satisfying the search predicate.

**Oracle:** A quantum operation that identifies valid candidates, usually by changing their phase.

**Search space:** The set of candidate inputs being examined.

**Unstructured search:** Search without an exploitable ordering or classical structure.

**Over-rotation:** The reduction in success probability caused by applying too many Grover iterations.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevLett.79.325 "A fast quantum mechanical algorithm for database search"

[4]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[5]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

[6]: https://doi.org/10.1103/PhysRevA.56.3457 "Quantum amplitude amplification and estimation"

## Key formulas: derivation and interpretation

### Grover iteration

Let \(|w\rangle\) be the marked state and let \(|s\rangle\) be the uniform superposition. The oracle is:

\[
O|x\rangle=(-1)^{f(x)}|x\rangle,
\]

and the diffusion operator is:

\[
D=2|s\rangle\langle s|-I.
\]

One Grover iteration is \(G=DO\). In the two-dimensional space spanned by the marked and unmarked components, each iteration rotates the state toward \(|w\rangle\). If \(\sin\theta=1/\sqrt N\), then after approximately

\[
r\approx\frac{\pi}{4}\sqrt N
\]

iterations, the marked-state probability is near one. The square-root behavior gives query complexity \(O(\sqrt N)\).


## Chapter assessment
### One-mark questions and answers

1. **Question:** What problem does Grover’s algorithm solve?
   **Answer:** Unstructured search for a marked item.

2. **Question:** What does the oracle do?
   **Answer:** It marks the target by a phase inversion.

3. **Question:** What is the diffusion operator?
   **Answer:** An inversion-about-the-mean operation.

4. **Question:** What is amplitude amplification?
   **Answer:** Increasing marked-state amplitude while decreasing unmarked-state amplitude.

5. **Question:** What is the complexity?
   **Answer:** O(√N) oracle queries.

### Chapter quiz

1. What problem does Grover’s algorithm solve?

2. What does the oracle do?

3. What is the diffusion operator?

4. What is amplitude amplification?

5. What is the complexity?

### Quiz answer key

1. **Unstructured search for a marked item.**

2. **It marks the target by a phase inversion.**

3. **An inversion-about-the-mean operation.**

4. **Increasing marked-state amplitude while decreasing unmarked-state amplitude.**

5. **O(√N) oracle queries.**


---


# Chapter 7: Quantum Fourier Transform (QFT) {#chapter-7-quantum-fourier-transform-qft}

## 7.1 Chapter overview

The **Quantum Fourier Transform (QFT)** is a quantum operation that transforms amplitudes from the computational basis into a Fourier basis. It is the quantum analogue of the discrete Fourier transform, but it acts on the amplitudes of a quantum state and can be implemented with a polynomial number of quantum gates.

For an \(n\)-qubit register, the computational basis contains

\[
N=2^n
\]

states. The QFT maps each basis state \(|x\rangle\) to a phase-encoded superposition:

\[
\operatorname{QFT}_N|x\rangle
=\frac{1}{\sqrt N}
\sum_{y=0}^{N-1}e^{2\pi ixy/N}|y\rangle.
\]

For a general state

\[
|\psi\rangle=\sum_{x=0}^{N-1}a_x|x\rangle,
\]

the transformed amplitudes are

\[
b_y=\frac{1}{\sqrt N}
\sum_{x=0}^{N-1}a_xe^{2\pi ixy/N}.
\]

The inverse QFT uses the opposite sign in the exponent:

\[
\operatorname{QFT}_N^{-1}|y\rangle
=\frac{1}{\sqrt N}
\sum_{x=0}^{N-1}e^{-2\pi ixy/N}|x\rangle.
\]

The QFT is important because it converts periodicity and phase information into measurable computational-basis information. It is a central subroutine in:

- Quantum phase estimation.
- Shor’s factoring algorithm.
- Period-finding algorithms.
- Hidden-period and hidden-subgroup algorithms.
- Quantum signal-processing procedures.
- Some quantum simulation and eigenvalue-estimation methods.

A direct classical DFT on \(N\) values generally requires \(O(N^2)\) arithmetic operations, or \(O(N\log N)\) with the classical fast Fourier transform. The standard exact QFT circuit uses \(O(n^2)\) elementary gates for \(N=2^n\), although the output is a quantum state and cannot be read out as all \(N\) transformed values in one measurement.

The QFT is therefore not simply a faster replacement for a classical FFT. Its value comes from how it interacts with quantum amplitudes, phase estimation, interference, and structured periodic information.

---

## 7.2 Learning objectives

After studying this chapter, learners should be able to:

1. Define the Quantum Fourier Transform.
2. Write the QFT transformation of a computational-basis state.
3. Compare the QFT with the classical discrete Fourier transform.
4. Explain the role of complex phases.
5. Prove that the QFT is unitary.
6. Derive the inverse QFT.
7. Decompose the QFT into Hadamard and controlled-phase gates.
8. Explain the bit-reversal operation in the standard circuit.
9. Work through one- and two-qubit QFT examples.
10. Describe how the QFT reveals periodicity.
11. Explain the role of QFT in phase estimation and Shor’s algorithm.
12. Implement an exact and approximate QFT circuit.

---

# 8. What is the Quantum Fourier Transform?

## 8.1 Definition

Let

\[
N=2^n
\]

for an \(n\)-qubit register. The QFT over \(N\) points is the unitary transformation

\[
F_N|x\rangle
=\frac{1}{\sqrt N}
\sum_{y=0}^{N-1}
\omega_N^{xy}|y\rangle,
\]

where

\[
\omega_N=e^{2\pi i/N}
\]

is the primitive \(N\)-th root of unity.

Equivalently,

\[
F_N|x\rangle
=\frac{1}{\sqrt N}
\sum_{y=0}^{N-1}
 e^{2\pi ixy/N}|y\rangle.
\]

The notation \(F_N\) and \(\operatorname{QFT}_N\) is used interchangeably.

## 8.2 Action on a general state

If

\[
|\psi\rangle=\sum_{x=0}^{N-1}a_x|x\rangle,
\]

then by linearity,

\[
F_N|\psi\rangle
=\sum_{y=0}^{N-1}b_y|y\rangle,
\]

where

\[
b_y=\frac{1}{\sqrt N}
\sum_{x=0}^{N-1}a_xe^{2\pi ixy/N}.
\]

The QFT replaces the original amplitude vector \((a_0,a_1,\ldots,a_{N-1})\) with its normalized Fourier transform.

## 8.3 Computational-basis notation

The integer \(x\) represents an \(n\)-bit string:

\[
x=x_{n-1}2^{n-1}+\cdots+x_12+x_0.
\]

The basis state \(|x\rangle\) is the corresponding computational-basis state.

## 8.4 Fourier basis states

The QFT basis states are

\[
|\widetilde y\rangle
=\frac{1}{\sqrt N}
\sum_{x=0}^{N-1}e^{2\pi ixy/N}|x\rangle.
\]

The QFT maps computational states to Fourier states, subject to convention and index ordering.

---

# 9. Key definitions

## 9.1 Discrete Fourier transform

The **discrete Fourier transform (DFT)** maps a list of complex numbers into frequency components. For a length-\(N\) vector \(a_x\), the normalized DFT is

\[
b_y=\frac{1}{\sqrt N}
\sum_{x=0}^{N-1}a_xe^{2\pi ixy/N}.
\]

## 9.2 Quantum Fourier Transform

The **Quantum Fourier Transform** is the unitary quantum operation whose matrix elements are

\[
(F_N)_{y,x}=\frac{1}{\sqrt N}e^{2\pi ixy/N}.
\]

## 9.3 Root of unity

A complex number \(\omega_N\) is an \(N\)-th root of unity when

\[
\omega_N^N=1.
\]

The primitive root used by the QFT is

\[
\omega_N=e^{2\pi i/N}.
\]

## 9.4 Phase

The **phase** of a complex amplitude is its angle in the complex plane. The QFT encodes information using phase factors such as

\[
e^{i\phi}.
\]

## 9.5 Controlled-phase gate

A **controlled-phase gate** applies a phase only when both control and target conditions are satisfied. A common rotation is

\[
R_k=
\begin{bmatrix}
1&0\\
0&e^{2\pi i/2^k}
\end{bmatrix}.
\]

A controlled-\(R_k\) gate applies this rotation to a target conditional on a control qubit.

## 9.6 Bit reversal

**Bit reversal** reverses the order of the bits in a computational-basis string. Standard QFT circuits often produce the transform with reversed qubit order, so a final layer of SWAP gates may be used.

## 9.7 Inverse QFT

The **inverse QFT** is the adjoint operation

\[
F_N^{-1}=F_N^\dagger.
\]

It uses the negative phase convention and reverses the action of the QFT.

---

# 10. The QFT matrix

## 10.1 Matrix form

The QFT matrix is

\[
F_N=\frac{1}{\sqrt N}
\begin{bmatrix}
1&1&1&1&\cdots&1\\
1&\omega_N&\omega_N^2&\omega_N^3&\cdots&\omega_N^{N-1}\\
1&\omega_N^2&\omega_N^4&\omega_N^6&\cdots&\omega_N^{2(N-1)}\\
\vdots&\vdots&\vdots&\vdots&\ddots&\vdots\\
1&\omega_N^{N-1}&\omega_N^{2(N-1)}&\omega_N^{3(N-1)}&\cdots&\omega_N^{(N-1)^2}
\end{bmatrix}.
\]

The row index is the output label \(y\), and the column index is the input label \(x\).

## 10.2 Example: QFT for one qubit

For \(N=2\),

\[
\omega_2=e^{\pi i}=-1.
\]

Therefore,

\[
F_2=\frac1{\sqrt2}
\begin{bmatrix}
1&1\\
1&-1
\end{bmatrix}=H.
\]

The one-qubit QFT is exactly the Hadamard gate.

## 10.3 Example: QFT for two qubits

For \(N=4\),

\[
\omega_4=e^{2\pi i/4}=i.
\]

The matrix is

\[
F_4=\frac12
\begin{bmatrix}
1&1&1&1\\
1&i&-1&-i\\
1&-1&1&-1\\
1&-i&-1&i
\end{bmatrix}.
\]

## 10.4 Normalization

The factor

\[
\frac1{\sqrt N}
\]

ensures that the transformation preserves state normalization.

---

# 11. Why the QFT is unitary

## 11.1 Orthogonality of Fourier columns

Consider two columns labeled \(x\) and \(x'\). Their inner product is

\[
\langle F_Nx'|F_Nx\rangle
=\frac1N\sum_{y=0}^{N-1}
\omega_N^{y(x-x')}.
\]

If \(x=x'\), every term equals 1, so

\[
\langle F_Nx|F_Nx\rangle=1.
\]

If \(x\neq x'\), the terms form a complete geometric series of roots of unity and sum to zero:

\[
\sum_{y=0}^{N-1}\omega_N^{y(x-x')}=0.
\]

Therefore,

\[
\langle F_Nx'|F_Nx\rangle=\delta_{x,x'}.
\]

The columns are orthonormal.

## 11.2 Unitary condition

Because the columns are orthonormal,

\[
F_N^\dagger F_N=I.
\]

Thus, the QFT is unitary and can be implemented as a reversible quantum circuit.

## 11.3 Inverse transform

The inverse is the conjugate transpose:

\[
F_N^{-1}=F_N^\dagger.
\]

Its action is

\[
F_N^{-1}|y\rangle
=\frac1{\sqrt N}
\sum_{x=0}^{N-1}e^{-2\pi ixy/N}|x\rangle.
\]

---

# 12. Product form of the QFT

## 12.1 Binary expansion

Let the input integer \(x\) have binary representation

\[
x=x_{n-1}x_{n-2}\cdots x_1x_0.
\]

Using binary fractions, the QFT output can be expressed as a tensor product of one-qubit states with phases determined by prefixes of the input.

## 12.2 Product-state formula

Ignoring final bit reversal for the moment, the QFT can be written as

\[
F_{2^n}|x_{n-1}\cdots x_1x_0\rangle
=\frac{1}{2^{n/2}}
\bigotimes_{j=0}^{n-1}
\left(|0\rangle+e^{2\pi i\,0.x_jx_{j-1}\cdots x_0}|1\rangle\right),
\]

where

\[
0.x_jx_{j-1}\cdots x_0
=\frac{x_j}{2}+\frac{x_{j-1}}{2^2}+\cdots+\frac{x_0}{2^{j+1}}.
\]

Depending on wire-order convention, the tensor factors appear in reversed order.

## 12.3 Interpretation

The QFT transforms a binary input into qubits whose relative phases encode binary fractions. Controlled rotations are used to build these phase relationships efficiently.

---

# 13. QFT circuit decomposition

## 13.1 Gate sequence

For an \(n\)-qubit register, the standard exact QFT circuit uses:

- One H gate per qubit.
- Controlled-\(R_k\) gates between pairs of qubits.
- Optional SWAP gates for bit reversal.

A schematic circuit is

```text
q0: ──H────CR2────CR3────CR4────SWAP──
q1: ───────●──────CR2────CR3────SWAP──
q2: ──────────────●──────CR2──────────
q3: ─────────────────────●────────────
```

The exact arrangement depends on whether qubit 0 is treated as the most- or least-significant bit.

## 13.2 Controlled rotations

The rotation gates are

\[
R_k=
\begin{bmatrix}
1&0\\
0&e^{2\pi i/2^k}
\end{bmatrix},
\qquad k\ge2.
\]

The angle becomes smaller as \(k\) increases.

## 13.3 Gate count

There are approximately

\[
\frac{n(n-1)}2
\]

controlled rotations and \(n\) Hadamard gates. Therefore, the exact QFT uses

\[
O(n^2)
\]

elementary operations, excluding detailed decompositions of controlled rotations.

## 13.4 Bit-reversal swaps

The standard decomposition often outputs the qubits in reverse order. To restore conventional order, apply

\[
\left\lfloor\frac n2\right\rfloor
\]

SWAP gates between symmetric qubits.

## 13.5 Inverse-QFT circuit

To implement the inverse QFT:

1. Reverse the order of the QFT gates.
2. Replace each gate by its adjoint.
3. Replace \(R_k\) with \(R_k^\dagger\), which uses the negative phase.
4. Apply the inverse bit-reversal swaps.

---

# 14. Approximate QFT

## 14.1 Motivation

Small-angle controlled rotations may contribute little to the final result, especially when only limited precision is required. The **approximate QFT** omits rotations below a chosen threshold.

## 14.2 Truncation

If rotations with \(k>m\) are omitted, the circuit depth can be reduced. The number of retained interactions is approximately

\[
O(nm)
\]

rather than \(O(n^2)\).

## 14.3 Accuracy trade-off

Removing rotations introduces approximation error. The choice of cutoff depends on:

- Required phase precision.
- Number of qubits.
- Hardware noise.
- Gate fidelity.
- Application requirements.

An approximate QFT can be preferable on NISQ hardware because it reduces two-qubit gate count.

---

# 15. QFT and periodicity

## 15.1 Periodic state

Suppose a state contains a periodic pattern with period \(r\):

\[
|\psi\rangle
=\frac1{\sqrt L}
\sum_{j=0}^{L-1}|x_0+jr\rangle.
\]

Applying the QFT produces amplitudes concentrated near frequencies compatible with the period.

## 15.2 Interference mechanism

For a Fourier output \(|y\rangle\), the amplitude includes terms

\[
\sum_{j=0}^{L-1}e^{2\pi i(x_0+jr)y/N}.
\]

Factor out the starting phase:

\[
e^{2\pi ix_0y/N}
\sum_{j=0}^{L-1}e^{2\pi ijry/N}.
\]

The geometric sum is large when

\[
\frac{ry}{N}
\]

is close to an integer. It is small when the phases cancel.

## 15.3 Period information

The QFT does not necessarily output the period directly. It produces samples related to fractions such as

\[
\frac{k}{r}.
\]

Classical post-processing, often using continued fractions, can recover \(r\).

---

# 16. Application: quantum phase estimation

## 16.1 Phase-estimation problem

Suppose a unitary \(U\) has an eigenstate \(|\psi\rangle\):

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle.
\]

The goal is to estimate \(\phi\).

## 16.2 Circuit structure

Quantum phase estimation uses:

1. A counting register initialized in \(|0\rangle^{\otimes t}\).
2. H gates on the counting register.
3. Controlled operations \(U^{2^j}\).
4. An inverse QFT on the counting register.
5. Measurement of the phase bits.

## 16.3 Why the inverse QFT is used

The controlled powers create a phase pattern in the counting register. The inverse QFT converts the phase pattern into a binary approximation of \(\phi\).

If

\[
\phi=0.\phi_1\phi_2\cdots\phi_t
\]

has a terminating \(t\)-bit binary expansion, ideal phase estimation can return the corresponding bit string exactly.

## 16.4 Precision

With \(t\) counting qubits, the phase resolution is approximately

\[
2^{-t}.
\]

More qubits provide finer phase precision but increase circuit cost and sensitivity to noise.

---

# 17. Application: Shor’s algorithm

## 17.1 Period finding

Shor’s algorithm reduces integer factoring to finding the period of

\[
f(x)=a^x\bmod N.
\]

The QFT is applied to a register containing periodic information from modular exponentiation.

## 17.2 Classical post-processing

The measured Fourier output provides an approximation to a rational number related to the period \(r\). Continued-fraction methods estimate \(r\), after which classical number theory can derive factors of \(N\).

## 17.3 Significance

The QFT is not the complete factoring algorithm. Shor’s algorithm also requires:

- Modular arithmetic.
- Quantum oracle construction.
- State preparation.
- Phase estimation or period-finding logic.
- Classical continued fractions.
- Factor verification.

The QFT is the component that extracts periodic information from quantum phases.

---

# 18. Worked examples

## 18.1 One-qubit QFT

For \(N=2\),

\[
\operatorname{QFT}_2=H.
\]

Therefore,

\[
\operatorname{QFT}_2|0\rangle
=\frac{|0\rangle+|1\rangle}{\sqrt2},
\]

and

\[
\operatorname{QFT}_2|1\rangle
=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

## 18.2 Two-qubit QFT of \(|00\rangle\)

For \(N=4\),

\[
F_4|0\rangle
=\frac12(|0\rangle+|1\rangle+|2\rangle+|3\rangle).
\]

In two-qubit notation,

\[
F_4|00\rangle
=\frac12(|00\rangle+|01\rangle+|10\rangle+|11\rangle).
\]

This is the uniform superposition.

## 18.3 Two-qubit QFT of \(|01\rangle\)

The state \(|01\rangle\) represents integer 1. Therefore,

\[
F_4|1\rangle
=\frac12\left(|0\rangle+i|1\rangle-|2\rangle-i|3\rangle\right).
\]

Using two-qubit labels,

\[
F_4|01\rangle
=\frac12\left(|00\rangle+i|01\rangle-|10\rangle-i|11\rangle\right).
\]

The magnitudes are equal, but the phases vary systematically.

## 18.4 QFT of a periodic superposition

Consider the two-state periodic state

\[
|\psi\rangle=\frac{|0\rangle+|2\rangle}{\sqrt2}
\]

in a four-dimensional space. Applying \(F_4\),

\[
F_4|\psi\rangle
=\frac1{\sqrt2}(F_4|0\rangle+F_4|2\rangle).
\]

Since the phase of \(|2\rangle\) is \((-1)^y\), the odd-frequency terms cancel and the even-frequency terms reinforce. The output is concentrated on Fourier indices compatible with period 2.

## 18.5 Inverse QFT check

For any basis state \(|x\rangle\),

\[
F_N^{-1}F_N|x\rangle=|x\rangle.
\]

For a general state,

\[
F_N^{-1}F_N|\psi\rangle=|\psi\rangle.
\]

This provides a useful simulator test.

---

# 19. Complexity and practical considerations

## 19.1 Exact QFT complexity

The standard exact QFT circuit uses

\[
O(n^2)
\]

one- and two-qubit operations.

## 19.2 Classical comparison

The classical DFT on \(N=2^n\) values requires:

- \(O(N^2)\) operations directly.
- \(O(N\log N)\) operations using the FFT.

The QFT uses \(O(n^2)=O((\log N)^2)\) gates, but it does not output the entire classical Fourier vector as readable classical data. These computations are not directly equivalent.

## 19.3 Approximate QFT complexity

With a fixed rotation cutoff, the approximate QFT can use

\[
O(n\log n)
\]

or more generally \(O(nm)\) gates, depending on the precision target.

## 19.4 Hardware connectivity

Controlled-phase gates may require routing on hardware with limited connectivity. SWAP gates increase depth and error. Hardware-aware compilation can reduce this overhead.

## 19.5 Measurement limitations

A single measurement returns one computational-basis sample. It does not reveal every transformed amplitude. The QFT is valuable when the algorithm needs a structured sample, such as a phase estimate or a period-related frequency.

---

# 20. Common misconceptions

## Misconception 1: The QFT is just a classical FFT running on qubits

The QFT is a unitary transformation of quantum amplitudes. It does not output a classical list of all Fourier coefficients in one run.

## Misconception 2: The QFT always gives a single sharp answer

The output distribution depends on the input state. Periodic inputs produce concentration near related frequencies, but arbitrary states may produce broad distributions.

## Misconception 3: The QFT creates information from nothing

The QFT reorganizes existing amplitudes and phases. It does not increase total information or violate unitarity.

## Misconception 4: Every phase is directly measurable

Global phase is not directly observable. Relative phase becomes useful only through interference and subsequent operations.

## Misconception 5: QFT complexity proves an exponential speedup for the FFT

The QFT has a compact circuit, but reading all output amplitudes would require many measurements. Its algorithmic value is tied to the surrounding quantum procedure.

## Misconception 6: The inverse QFT is the same gate sequence as the QFT

The inverse QFT reverses the gate order and conjugates the phase rotations.

## Misconception 7: Bit reversal is a mathematical error

Bit reversal is a consequence of the chosen circuit decomposition and qubit-order convention. SWAP gates restore conventional ordering when needed.

## Misconception 8: Approximate QFT is always equivalent to exact QFT

Omitting small rotations introduces approximation error. It is useful only when the error is acceptable for the application.

---

# 21. Chapter summary

The Quantum Fourier Transform is the unitary transformation

\[
F_N|x\rangle
=\frac1{\sqrt N}\sum_{y=0}^{N-1}e^{2\pi ixy/N}|y\rangle.
\]

It transforms computational-basis amplitudes into a Fourier representation of phase and frequency information.

The QFT is unitary because its Fourier basis states are orthonormal:

\[
F_N^\dagger F_N=I.
\]

Its inverse is

\[
F_N^{-1}=F_N^\dagger,
\]

with negative phases and reversed gate order.

For \(n\) qubits, the standard exact QFT uses Hadamard and controlled-phase gates with complexity

\[
O(n^2).
\]

A final bit-reversal operation may be required depending on the circuit convention.

The QFT is important because it reveals periodicity and phase information through interference. It is a central subroutine in quantum phase estimation and Shor’s factoring algorithm.

The QFT should not be described as simply replacing a classical FFT. Its output is a quantum state, and measurement reveals only samples. Its power comes from how phase information is encoded, transformed, and measured within a larger quantum algorithm.

---

# 22. Formula sheet

Number of basis states:

\[
N=2^n.
\]

Primitive root of unity:

\[
\omega_N=e^{2\pi i/N}.
\]

QFT basis-state transform:

\[
F_N|x\rangle
=\frac1{\sqrt N}
\sum_{y=0}^{N-1}e^{2\pi ixy/N}|y\rangle.
\]

General-state transform:

\[
b_y=\frac1{\sqrt N}
\sum_{x=0}^{N-1}a_xe^{2\pi ixy/N}.
\]

Inverse QFT:

\[
F_N^{-1}|y\rangle
=\frac1{\sqrt N}
\sum_{x=0}^{N-1}e^{-2\pi ixy/N}|x\rangle.
\]

Unitarity:

\[
F_N^\dagger F_N=I.
\]

Controlled rotation:

\[
R_k=
\begin{bmatrix}
1&0\\
0&e^{2\pi i/2^k}
\end{bmatrix}.
\]

Exact QFT gate complexity:

\[
O(n^2).
\]

Approximate QFT complexity:

\[
O(nm)
\]

when rotations up to a chosen cutoff parameter \(m\) are retained.

Phase-estimation resolution:

\[
\Delta\phi\approx2^{-t}.
\]

---

# 23. Review questions and exercises

## Conceptual questions

1. Define the Quantum Fourier Transform.
2. What is the value of \(N\) for an \(n\)-qubit register?
3. What is a primitive root of unity?
4. Why is the QFT unitary?
5. What is the inverse QFT?
6. What is the role of controlled-phase gates?
7. Why do standard QFT circuits use bit reversal?
8. What is the complexity of the exact QFT circuit?
9. What is an approximate QFT?
10. How does the QFT reveal periodicity?
11. Why is the QFT useful in phase estimation?
12. Why is the QFT not simply a faster classical FFT?

## Numerical exercises

1. Calculate \(N\) for \(n=3\), \(n=5\), and \(n=10\).
2. Calculate \(\omega_4\), \(\omega_8\), and \(\omega_{16}\).
3. Write the matrix \(F_2\).
4. Write the matrix \(F_4\).
5. Calculate \(F_4|0\rangle\).
6. Calculate \(F_4|1\rangle\).
7. Verify that \(F_2=H\).
8. Show that the columns of \(F_4\) are orthonormal.
9. Calculate the number of controlled rotations in an exact five-qubit QFT.
10. Estimate the phase resolution of a phase-estimation register with 8 qubits.

## Circuit exercises

Draw and analyze:

1. The one-qubit QFT.
2. The two-qubit QFT.
3. A three-qubit exact QFT.
4. The inverse QFT.
5. A QFT circuit with final bit-reversal swaps.
6. An approximate QFT with small rotations removed.
7. The inverse-QFT stage of phase estimation.

For each circuit:

- Identify Hadamard gates.
- Identify controlled rotations.
- Track qubit order.
- Calculate the phase factors.
- Compare exact and approximate outputs.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement a one-qubit QFT and compare it with H.
2. Implement a two-qubit QFT.
3. Verify \(F_N^{-1}F_N=I\) on basis states.
4. Compare a library QFT with a manually decomposed circuit.
5. Plot measurement distributions for Fourier basis states.
6. Create a periodic superposition and observe Fourier concentration.
7. Implement an approximate QFT.
8. Use an inverse QFT in a small phase-estimation circuit.
9. Compare gate count and depth for exact and approximate QFTs.
10. Test the effect of omitting final bit-reversal swaps.

---

# 24. Glossary

**Bit reversal:** Reordering the qubits in reverse significance order.

**Controlled phase rotation:** A conditional phase gate used in QFT decomposition.

**Discrete Fourier transform:** A classical transform from time or index amplitudes to frequency amplitudes.

**Fourier basis:** The basis of phase-encoded states produced by the QFT.

**Inverse QFT:** The adjoint operation that reverses the QFT.

**Primitive root of unity:** A complex number whose powers generate the roots of unity used in the Fourier matrix.

**Quantum Fourier Transform:** A unitary quantum implementation of the normalized discrete Fourier transform on amplitudes.

**Periodicity:** Repetition or regular spacing in a function or quantum-state amplitude pattern.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[4]: https://doi.org/10.1103/PhysRevLett.79.325 "A fast quantum mechanical algorithm for database search"

[5]: https://doi.org/10.1103/PhysRevLett.81.3071 "Strengths and weaknesses of quantum computing"

[6]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

## Key formulas: derivation and interpretation

### Quantum Fourier Transform

For \(N=2^n\):

\[
\mathrm{QFT}_N|x\rangle=\frac{1}{\sqrt N}\sum_{y=0}^{N-1}e^{2\pi ixy/N}|y\rangle.
\]

**Derivation of normalization:** There are N terms, each with magnitude \(1/\sqrt N\). The squared magnitudes sum to \(N(1/N)=1\). The complex phase \(e^{2\pi ixy/N}\) creates the Fourier interference pattern.

The inverse transform changes the sign in the exponent:

\[
\mathrm{QFT}_N^\dagger|y\rangle=\frac{1}{\sqrt N}\sum_xe^{-2\pi ixy/N}|x\rangle.
\]

Controlled-phase gates implement the relative phases in an efficient circuit.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What does QFT transform?
   **Answer:** Computational-basis amplitudes into a discrete Fourier basis.

2. **Question:** What is the QFT modulus?
   **Answer:** N=2^n for n qubits.

3. **Question:** What is the inverse QFT?
   **Answer:** The adjoint QFT, denoted QFT†.

4. **Question:** Which gates implement QFT circuits?
   **Answer:** Hadamard and controlled-phase gates, followed by optional swaps.

5. **Question:** Name one application.
   **Answer:** Phase estimation, period finding, or Shor’s algorithm.

### Chapter quiz

1. What does QFT transform?

2. What is the QFT modulus?

3. What is the inverse QFT?

4. Which gates implement QFT circuits?

5. Name one application.

### Quiz answer key

1. **Computational-basis amplitudes into a discrete Fourier basis.**

2. **N=2^n for n qubits.**

3. **The adjoint QFT, denoted QFT†.**

4. **Hadamard and controlled-phase gates, followed by optional swaps.**

5. **Phase estimation, period finding, or Shor’s algorithm.**


---


# Chapter 8: Quantum Phase Estimation (QPE) {#chapter-8-quantum-phase-estimation-qpe}

## 1.1 Chapter overview

**Quantum Phase Estimation (QPE)** is a quantum algorithm for estimating the phase associated with an eigenvalue of a unitary operator. It is one of the most important subroutines in quantum computing because many physical and computational problems can be reduced to estimating eigenvalues, energies, frequencies, or periods.

Suppose a unitary operator \(U\) has an eigenstate \(|\psi\rangle\) satisfying

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle,
\]

where \(\phi\in[0,1)\) is an unknown phase. Quantum phase estimation produces a binary approximation to \(\phi\).

If the phase has a terminating \(t\)-bit binary representation,

\[
\phi=0.\phi_1\phi_2\cdots\phi_t,
\]

then an ideal QPE circuit can return the bit string

\[
\phi_1\phi_2\cdots\phi_t
\]

with probability 1, subject to register-order conventions.

The standard QPE circuit uses:

1. A counting register of \(t\) qubits.
2. A target register containing an eigenstate \(|\psi\rangle\).
3. Hadamard gates on the counting register.
4. Controlled powers \(U^{2^j}\).
5. An inverse Quantum Fourier Transform on the counting register.
6. Measurement of the counting register.

The conceptual workflow is

\[
\text{prepare phase register}
\rightarrow
\text{encode phase through controlled powers}
\rightarrow
\text{apply inverse QFT}
\rightarrow
\text{measure phase bits}.
\]

QPE is used in:

- Shor’s factoring algorithm.
- Quantum simulation and energy estimation.
- Hamiltonian eigenvalue estimation.
- Quantum chemistry.
- Quantum signal processing.
- Amplitude estimation.
- Eigenvalue-based linear-algebra algorithms.

QPE requires coherent controlled powers of \(U\), an eigenstate or approximate eigenstate, and a sufficiently deep circuit. It is therefore more demanding than many near-term variational methods, but it provides a powerful ideal-model foundation for fault-tolerant quantum computation.

---

## 1.2 Learning objectives

After studying this chapter, learners should be able to:

1. Define an eigenstate and eigenvalue of a unitary operator.
2. Explain how a unitary eigenvalue can be represented by a phase.
3. State the quantum phase-estimation problem.
4. Identify the counting and target registers.
5. Explain the role of controlled powers \(U^{2^j}\).
6. Derive phase kickback in QPE.
7. Explain how the inverse QFT extracts binary phase information.
8. Analyze exact phase estimation for a terminating binary phase.
9. Understand finite-precision and measurement-probability effects.
10. Explain the role of approximate eigenstates.
11. Calculate phase resolution from the number of counting qubits.
12. Implement a small QPE circuit on a simulator.
13. Describe applications in Shor’s algorithm and quantum simulation.

---

# 2. The phase-estimation problem

## 2.1 Unitary operator

An operator \(U\) is **unitary** when

\[
U^\dagger U=UU^\dagger=I.
\]

Unitary operators preserve inner products and quantum-state normalization. They describe reversible quantum evolution.

## 2.2 Eigenstate and eigenvalue

A nonzero state \(|\psi\rangle\) is an eigenstate of \(U\) if

\[
U|\psi\rangle=\lambda|\psi\rangle,
\]

where \(\lambda\) is the corresponding eigenvalue.

Because \(U\) is unitary, every eigenvalue has magnitude 1:

\[
|\lambda|=1.
\]

Therefore, the eigenvalue can be written as

\[
\lambda=e^{2\pi i\phi},
\]

where

\[
0\le\phi<1.
\]

The number \(\phi\) is called the eigenphase.

## 2.3 QPE input and output

The input consists of:

- A unitary operator \(U\).
- An eigenstate \(|\psi\rangle\) of \(U\), or a state with significant overlap with an eigenstate.

The output is an estimate \(\tilde\phi\) of \(\phi\):

\[
\tilde\phi\approx\phi.
\]

The estimate is represented by a binary measurement result.

## 2.4 Phase range

The phase is periodic modulo 1:

\[
e^{2\pi i(\phi+1)}=e^{2\pi i\phi}.
\]

Therefore, QPE estimates the fractional phase in the interval

\[
\phi\in[0,1).
\]

---

# 3. Key definitions

## 3.1 Eigenphase

An **eigenphase** is the real number \(\phi\) in

\[
\lambda=e^{2\pi i\phi}
\]

for a unitary eigenvalue \(\lambda\).

## 3.2 Counting register

The **counting register** is the group of \(t\) qubits that stores the phase estimate. It is initialized in \(|0\rangle^{\otimes t}\), placed in superposition, and measured at the end.

## 3.3 Target register

The **target register** contains the eigenstate \(|\psi\rangle\). Controlled powers of \(U\) act on this register.

## 3.4 Controlled unitary

A controlled unitary applies \(U\) to the target only when the control qubit is \(|1\rangle\):

\[
|0\rangle|\varphi\rangle\mapsto|0\rangle|\varphi\rangle,
\]

\[
|1\rangle|\varphi\rangle\mapsto|1\rangle U|\varphi\rangle.
\]

## 3.5 Controlled powers

QPE applies controlled operations

\[
U^{2^j}
\]

for counting-qubit index \(j\). These powers create phase shifts with exponentially increasing precision.

## 3.6 Phase kickback

When the target is an eigenstate,

\[
U^{2^j}|\psi\rangle
=e^{2\pi i2^j\phi}|\psi\rangle.
\]

The phase is transferred to the corresponding counting-qubit branch. This is phase kickback.

## 3.7 Phase resolution

With \(t\) counting qubits, the basic phase grid has spacing

\[
2^{-t}.
\]

Increasing \(t\) improves the possible precision.

## 3.8 Approximate eigenstate

An **approximate eigenstate** is a state that can be expanded as

\[
|\widetilde\psi\rangle
=\sum_k c_k|\psi_k\rangle,
\]

where \(|\psi_k\rangle\) are eigenstates of \(U\). QPE then produces a phase estimate corresponding to eigenphase \(\phi_k\) with probability approximately \(|c_k|^2\).

---

# 4. Controlled powers and phase kickback

## 4.1 First controlled operation

Suppose the counting qubit is in

\[
\frac{|0\rangle+|1\rangle}{\sqrt2}
\]

and the target is \(|\psi\rangle\). A controlled-U operation gives

\[
\frac{|0\rangle|\psi\rangle+|1\rangle U|\psi\rangle}{\sqrt2}.
\]

Using

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle,
\]

we obtain

\[
\frac{|0\rangle+e^{2\pi i\phi}|1\rangle}{\sqrt2}|\psi\rangle.
\]

The target factors out, and the eigenphase appears in the counting qubit.

## 4.2 Controlled powers

For the \(j\)-th counting qubit,

\[
\operatorname{c-}U^{2^j}
\]

produces

\[
\frac{|0\rangle+e^{2\pi i2^j\phi}|1\rangle}{\sqrt2}|\psi\rangle.
\]

The powers allow the circuit to access increasingly fine binary digits of \(\phi\).

## 4.3 Full phase-register state

After all controlled powers, the counting register has a phase-encoded state of the form

\[
\frac{1}{2^{t/2}}
\bigotimes_{j=0}^{t-1}
\left(|0\rangle+e^{2\pi i2^j\phi}|1\rangle\right),
\]

up to ordering of the qubits.

The inverse QFT transforms this phase pattern into a computational-basis estimate.

---

# 5. Standard QPE circuit

## 5.1 Circuit diagram

```text
count q0: ──H────────●──────────────────────IQFT──M──
                     │
count q1: ──H────────┼────●─────────────────IQFT──M──
                     │    │
⋮                    │    │
count q(t-1):─H──────┼────┼────●────────────IQFT──M──
                     │    │    │
 target: ────────────U────U²───U⁴───⋯───────
```

The exact association of powers with qubit positions depends on the register-order convention.

## 5.2 Algorithm steps

1. Prepare the counting register in \(|0\rangle^{\otimes t}\).
2. Prepare the target register in eigenstate \(|\psi\rangle\).
3. Apply H to every counting qubit.
4. Apply controlled \(U^{2^j}\) operations.
5. Apply the inverse QFT to the counting register.
6. Measure the counting register.
7. Interpret the result as a binary estimate of \(\phi\).

## 5.3 Initial state

The complete initial state is

\[
|\Psi_0\rangle
=|0\rangle^{\otimes t}|\psi\rangle.
\]

After the Hadamard layer,

\[
|\Psi_1\rangle
=\frac1{\sqrt{2^t}}
\sum_{y=0}^{2^t-1}|y\rangle|\psi\rangle.
\]

## 5.4 Controlled-unitary stage

The controlled powers produce

\[
|\Psi_2\rangle
=\frac1{\sqrt{2^t}}
\sum_{y=0}^{2^t-1}
 e^{2\pi i y\phi}|y\rangle|\psi\rangle,
\]

with the precise power-to-bit ordering chosen consistently.

The target remains \(|\psi\rangle\), while the counting register contains a phase gradient.

## 5.5 Inverse QFT stage

The phase gradient is exactly the type of state that the inverse QFT converts into a computational-basis state when \(\phi\) is represented on the available grid.

---

# 6. Exact phase estimation

## 6.1 Terminating binary phase

Suppose

\[
\phi=0.\phi_1\phi_2\cdots\phi_t
=\frac{m}{2^t}
\]

for an integer \(m\in\{0,1,\ldots,2^t-1\}\).

Then the phase register after controlled powers is

\[
\frac1{\sqrt{2^t}}
\sum_{y=0}^{2^t-1}e^{2\pi iym/2^t}|y\rangle.
\]

This is the QFT of \(|m\rangle\):

\[
F_{2^t}|m\rangle
=\frac1{\sqrt{2^t}}
\sum_y e^{2\pi iym/2^t}|y\rangle.
\]

Applying the inverse QFT gives

\[
F_{2^t}^{-1}F_{2^t}|m\rangle=|m\rangle.
\]

The measurement returns \(m\), which represents \(\phi\).

## 6.2 Example: phase \(\phi=1/2\)

With one counting qubit,

\[
\phi=\frac12=0.1_2.
\]

The controlled-U operation creates

\[
\frac{|0\rangle-|1\rangle}{\sqrt2}=|-\rangle.
\]

Applying the inverse QFT, which is H for one qubit, gives

\[
H|-\rangle=|1\rangle.
\]

The measured phase bit is 1.

## 6.3 Example: phase \(\phi=1/4\)

With two counting qubits,

\[
\phi=\frac14=0.01_2.
\]

The ideal QPE output is

\[
|01\rangle,
\]

subject to bit-order convention. The measured binary fraction is 0.01, equal to 1/4.

## 6.4 Example: phase \(\phi=3/4\)

With two counting qubits,

\[
\phi=\frac34=0.11_2.
\]

The ideal output is the two-bit string representing 3, again subject to register-order convention.

---

# 7. Finite-precision phase estimation

## 7.1 Non-terminating phase

Most phases do not have a finite binary expansion. For example,

\[
\phi=\frac13=0.010101\ldots_2.
\]

A finite counting register cannot represent all binary digits exactly.

## 7.2 Output distribution

After the inverse QFT, measurements are concentrated near the integer

\[
m\approx2^t\phi.
\]

The most likely estimate is often

\[
\tilde\phi=\frac{m}{2^t},
\]

where \(m\) is the measured integer.

## 7.3 Precision bound

With \(t\) counting qubits, the grid spacing is

\[
\Delta\phi=2^{-t}.
\]

The nearest grid estimate has absolute error at most approximately

\[
\frac{1}{2^{t+1}}
\]

when rounding to the nearest point, although probability tails and implementation details must also be considered.

## 7.4 Additional precision qubits

Additional counting qubits beyond the desired output precision can improve the probability of obtaining a close estimate. These are sometimes called guard or precision qubits.

## 7.5 Probability of a good estimate

For standard QPE, the probability of obtaining an estimate within a specified precision can be bounded below by a constant when enough counting qubits are used. Repeated executions or additional qubits can increase confidence.

---

# 8. QPE with an approximate eigenstate

## 8.1 Eigenstate decomposition

Suppose the target is not a single eigenstate but

\[
|\varphi\rangle
=\sum_k c_k|\psi_k\rangle,
\]

where

\[
U|\psi_k\rangle=e^{2\pi i\phi_k}|\psi_k\rangle.
\]

The QPE circuit acts linearly:

\[
|\varphi\rangle
\mapsto
\sum_k c_k|\text{phase estimate for }\phi_k\rangle|\psi_k\rangle.
\]

## 8.2 Measurement probabilities

Measuring the target and counting registers produces an estimate near \(\phi_k\) with probability approximately

\[
|c_k|^2.
\]

QPE therefore samples eigenphases according to the spectral weights of the input state.

## 8.3 Ground-state estimation

In quantum chemistry, a trial state may have overlap with several energy eigenstates. If the ground state has large overlap, QPE can return its energy with high probability. State preparation is therefore a central challenge.

---

# 9. Phase estimation and Hamiltonians

## 9.1 Hamiltonian evolution

A Hamiltonian \(H\) generates unitary evolution

\[
U(t)=e^{-iHt}.
\]

If

\[
H|E_k\rangle=E_k|E_k\rangle,
\]

then

\[
U(t)|E_k\rangle=e^{-iE_kt}|E_k\rangle.
\]

The energy is encoded in the phase

\[
e^{-iE_kt}.
\]

## 9.2 Converting energy to phase

QPE estimates the phase of \(U(t)\). Since the phase is periodic, the evolution time and energy range must be chosen so that the desired energies can be distinguished without ambiguity.

## 9.3 Applications

Hamiltonian phase estimation supports:

- Molecular ground-state energies.
- Excitation energies.
- Material properties.
- Quantum dynamics.
- Spectral analysis.
- Eigenvalue problems.

---

# 10. Relationship to the Quantum Fourier Transform

## 10.1 QFT as an extraction tool

The controlled powers encode a phase gradient:

\[
\frac1{\sqrt{2^t}}
\sum_y e^{2\pi i y\phi}|y\rangle.
\]

The inverse QFT maps this gradient to a computational-basis estimate.

## 10.2 Why the inverse QFT is required

The phase register is prepared in the Fourier basis of the estimate integer. Applying the inverse QFT returns it to the computational basis.

This is analogous to decoding a Fourier-encoded signal.

## 10.3 QPE circuit components

QPE combines:

- Superposition.
- Controlled operations.
- Eigenvalue phase kickback.
- Quantum Fourier transformation.
- Measurement and classical binary interpretation.

---

# 11. Applications

## 11.1 Shor’s factoring algorithm

Shor’s algorithm uses phase estimation or an equivalent period-finding procedure to estimate the period of modular exponentiation. The measured phase is classically processed using continued fractions.

## 11.2 Quantum chemistry

Quantum phase estimation can estimate eigenvalues of molecular Hamiltonians. These eigenvalues correspond to physical energies.

## 11.3 Amplitude estimation

Quantum amplitude estimation uses phase estimation on a Grover-like operator to estimate probabilities with improved scaling compared with classical sampling in suitable settings.

## 11.4 Quantum simulation

QPE can estimate eigenphases of time-evolution operators and therefore extract properties of simulated quantum systems.

## 11.5 Linear algebra

Eigenvalue and eigenvector information can be used in quantum algorithms for matrix inversion, spectral analysis, and differential equations.

---

# 12. Complexity and resource requirements

## 12.1 Counting qubits

To obtain approximately \(t\) bits of phase precision, QPE uses at least \(t\) counting qubits, often with additional guard qubits.

## 12.2 Controlled-unitary cost

The circuit requires controlled powers

\[
U,U^2,U^4,\ldots,U^{2^{t-1}}.
\]

The total cost depends on how these powers are implemented. If \(U^{2^j}\) is built by repeating \(U\), the gate cost can grow rapidly.

## 12.3 Inverse-QFT cost

The exact inverse QFT on \(t\) counting qubits uses

\[
O(t^2)
\]

gates. Approximate versions reduce the number of small-angle controlled rotations.

## 12.4 Circuit depth

The controlled-power stage often dominates the depth. Long coherent evolution makes QPE demanding on noisy hardware.

## 12.5 Measurement repetitions

Finite precision and noise may require repeated circuit executions. The total cost includes the number of shots needed to estimate the phase distribution reliably.

---

# 13. Worked examples

## 13.1 One-qubit phase gate

Let the target be \(|1\rangle\) and let

\[
U=Z.
\]

Since

\[
Z|1\rangle=-|1\rangle=e^{2\pi i(1/2)}|1\rangle,
\]

the eigenphase is

\[
\phi=\frac12.
\]

One counting qubit is sufficient. QPE returns the phase bit 1.

## 13.2 Phase gate with \(\phi=1/4\)

Let

\[
U=R_2=
\begin{bmatrix}
1&0\\
0&i
\end{bmatrix}.
\]

For target \(|1\rangle\),

\[
U|1\rangle=i|1\rangle
=e^{2\pi i(1/4)}|1\rangle.
\]

With two counting qubits, QPE returns the estimate 01, representing 1/4.

## 13.3 Phase \(\phi=5/8\)

With three counting qubits,

\[
\phi=\frac58=0.101_2.
\]

The ideal counting-register output is 101, assuming the conventional bit order.

## 13.4 Non-terminating phase \(\phi=1/3\)

Using three counting qubits, the grid spacing is

\[
2^{-3}=\frac18.
\]

The nearest grid values to 1/3 are 3/8 and 2/8. The output distribution is concentrated near the closest estimates, with the precise probabilities determined by the inverse-QFT amplitudes.

## 13.5 Approximate eigenstate

Suppose

\[
|\varphi\rangle
=\sqrt{0.8}|\psi_0\rangle+
\sqrt{0.2}|\psi_1\rangle,
\]

where the eigenphases are \(\phi_0\) and \(\phi_1\). QPE returns an estimate near \(\phi_0\) with probability approximately 0.8 and near \(\phi_1\) with probability approximately 0.2.

---

# 14. Implementation and simulation

## 14.1 High-level pseudocode

```text
function QPE(U, eigenstate, t):
    create t counting qubits in |0⟩
    prepare target register in eigenstate |ψ⟩

    apply H to every counting qubit

    for j from 0 to t-1:
        apply controlled-U^(2^j)

    apply inverse QFT to counting register
    measure counting register

    convert measured integer m to phase estimate m / 2^t
    return phase estimate
```

## 14.2 Simulator workflow

1. Choose a unitary with a known eigenstate and eigenphase.
2. Prepare the target eigenstate.
3. Create a counting register.
4. Apply Hadamards.
5. Add controlled powers.
6. Apply the inverse QFT.
7. Measure the counting register.
8. Compare the estimate with the known phase.

## 14.3 Register ordering

Different frameworks use different conventions for the least-significant qubit. A reversed output string does not necessarily indicate an incorrect circuit. Check whether the implementation includes final swaps or uses reversed classical-bit mapping.

## 14.4 Noise model

Add noise to investigate:

- Imperfect controlled gates.
- Approximate eigenstate preparation.
- Phase drift.
- Readout errors.
- Decoherence during controlled powers.

Compare the ideal phase histogram with the noisy histogram.

## 14.5 Iterative phase estimation

When a full counting register is too expensive, **iterative phase estimation** uses one or a few ancilla qubits repeatedly. Classical feedback estimates phase bits one at a time, reducing qubit count at the cost of repeated experiments and adaptive control.

---

# 15. Common misconceptions

## Misconception 1: QPE estimates any number without assumptions

The unitary and target state must satisfy the eigenvalue condition, or the target must have a known decomposition into eigenstates.

## Misconception 2: One counting qubit gives arbitrary precision

One counting qubit distinguishes only a coarse phase grid. Precision improves with more counting qubits or iterative procedures.

## Misconception 3: The target register is measured first

The target eigenstate is generally preserved by the controlled-unitary operations. The counting register is measured to obtain the phase.

## Misconception 4: Controlled-U is the same as applying U to every branch

The controlled operation applies U only on the control-1 branch, creating a relative phase through the eigenvalue.

## Misconception 5: The output is always exact

Exact output occurs when the phase has a finite binary representation supported by the counting register. Otherwise, QPE produces a probability distribution around nearby estimates.

## Misconception 6: The inverse QFT discovers the eigenphase by itself

The controlled powers first encode the phase. The inverse QFT decodes that phase pattern into a measurable estimate.

## Misconception 7: QPE is easy on current noisy hardware

Controlled powers and long coherent circuits can be expensive and noise-sensitive. QPE is especially natural in fault-tolerant settings.

## Misconception 8: An approximate eigenstate returns one arbitrary phase

It returns eigenphase estimates according to the squared overlaps of the input state with the eigenstates.

---

# 16. Chapter summary

Quantum Phase Estimation estimates the eigenphase \(\phi\) in

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle.
\]

The circuit uses a counting register, a target eigenstate, controlled powers of \(U\), and an inverse QFT.

The controlled powers create phase kickback:

\[
U^{2^j}|\psi\rangle
=e^{2\pi i2^j\phi}|\psi\rangle.
\]

After all controlled operations, the counting register contains a phase gradient. The inverse QFT converts the gradient into a binary estimate of \(\phi\).

For a phase with a terminating \(t\)-bit representation,

\[
\phi=\frac{m}{2^t},
\]

ideal QPE returns \(m\) exactly. For a general phase, the output is concentrated near the closest grid points, with resolution approximately

\[
2^{-t}.
\]

If the target is an approximate eigenstate, QPE samples the phases of its eigenstate components according to their squared overlaps.

QPE is a central subroutine in Shor’s algorithm, quantum chemistry, Hamiltonian simulation, amplitude estimation, and quantum linear algebra. Its main practical challenges are controlled-power construction, state preparation, circuit depth, precision, and noise.

---

# 17. Formula sheet

Unitary eigenvalue equation:

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle.
\]

Eigenphase range:

\[
0\le\phi<1.
\]

Controlled-power phase kickback:

\[
U^{2^j}|\psi\rangle
=e^{2\pi i2^j\phi}|\psi\rangle.
\]

Phase-register state:

\[
\frac1{\sqrt{2^t}}
\sum_{y=0}^{2^t-1}e^{2\pi iy\phi}|y\rangle.
\]

Terminating binary phase:

\[
\phi=\frac{m}{2^t}.
\]

Ideal QPE output:

\[
|m\rangle.
\]

Phase resolution:

\[
\Delta\phi\approx2^{-t}.
\]

Approximate-eigenstate decomposition:

\[
|\widetilde\psi\rangle=\sum_kc_k|\psi_k\rangle.
\]

Phase-output probability:

\[
P(\phi_k)\approx|c_k|^2.
\]

Hamiltonian evolution:

\[
U(t)=e^{-iHt}.
\]

Hamiltonian eigenvalue relation:

\[
H|E_k\rangle=E_k|E_k\rangle
\Rightarrow
U(t)|E_k\rangle=e^{-iE_kt}|E_k\rangle.
\]

Inverse QFT:

\[
F_{2^t}^{-1}F_{2^t}=I.
\]

---

# 18. Review questions and exercises

## Conceptual questions

1. What is quantum phase estimation?
2. What is an eigenstate of a unitary operator?
3. Why do unitary eigenvalues have magnitude 1?
4. What is an eigenphase?
5. What is the role of the counting register?
6. What is the role of the target register?
7. Why are controlled powers \(U^{2^j}\) used?
8. Explain phase kickback in QPE.
9. Why is the inverse QFT applied?
10. What determines phase resolution?
11. What happens when the phase does not terminate in binary?
12. What happens when the target is an approximate eigenstate?
13. How is QPE used in Shor’s algorithm?
14. Why is QPE challenging on noisy hardware?

## Numerical exercises

1. Express \(1/2\), \(1/4\), and \(3/4\) in binary fractions.
2. Calculate the phase resolution for \(t=3\), \(t=5\), and \(t=10\).
3. Identify the eigenphase of the eigenvalue \(-1\).
4. Identify the eigenphase of the eigenvalue \(i\).
5. Identify the eigenphase of the eigenvalue \(e^{3\pi i/2}\).
6. If a phase estimate is measured as integer \(m=5\) with \(t=3\), calculate \(m/2^t\).
7. Write the controlled phase produced by \(U^4\) for eigenphase \(\phi=1/8\).
8. Calculate the phase-estimation resolution for an 8-qubit counting register.
9. If \(|c_0|^2=0.7\) and \(|c_1|^2=0.3\), estimate the probability of measuring each eigenphase.
10. Explain how increasing evolution time changes the encoded phase for Hamiltonian simulation.

## Circuit exercises

Draw and analyze QPE circuits for:

1. \(U=Z\) with target \(|1\rangle\).
2. \(U=R_2\) with target \(|1\rangle\).
3. A phase of \(\phi=3/8\) using three counting qubits.
4. A two-qubit inverse-QFT stage.
5. A QPE circuit with one guard qubit.
6. QPE for a target state that is a superposition of two eigenstates.

For each circuit:

- Identify the counting and target registers.
- Calculate the controlled phases.
- Apply the inverse QFT conceptually.
- Predict the measurement distribution.
- Convert the result to a phase estimate.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another quantum framework:

1. Implement QPE for \(U=Z\).
2. Implement QPE for a phase-rotation gate.
3. Compare one-, two-, and three-qubit counting registers.
4. Verify exact estimation for terminating binary phases.
5. Study the output distribution for \(\phi=1/3\).
6. Add an approximate eigenstate and observe multiple phase peaks.
7. Implement an inverse QFT manually and compare it with a library operation.
8. Add controlled powers and inspect circuit depth.
9. Simulate Hamiltonian evolution for a small diagonal Hamiltonian.
10. Add a noise model and measure phase-estimation error.

---

# 19. Glossary

**Counting register:** The qubit register that stores the estimated phase bits.

**Controlled power:** A controlled application of \(U^{2^j}\) used to encode phase precision.

**Eigenphase:** The fractional phase \(\phi\) in a unitary eigenvalue \(e^{2\pi i\phi}\).

**Eigenstate:** A state that is mapped to itself up to a scalar eigenvalue.

**Guard qubit:** An additional counting qubit used to improve finite-precision success probability.

**Inverse QFT:** The adjoint Fourier transformation that decodes the phase gradient.

**Phase estimation:** A quantum algorithm that estimates eigenphases of unitary operators.

**Phase kickback:** The transfer of an eigenvalue phase to the control register.

**Target register:** The register containing the eigenstate on which controlled powers act.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevLett.66.311 "Quantum mechanics helps in searching for a needle in a haystack"

[4]: https://doi.org/10.1103/PhysRevLett.78.390 "Quantum mechanical entropy of entanglement"

[5]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[6]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

## Key formulas: derivation and interpretation

### Eigenphase relation

If

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle,
\qquad 0\le\phi<1,
\]

then \(|\psi\rangle\) is an eigenvector and \(\phi\) is its phase. Controlled powers produce:

\[
U^{2^k}|\psi\rangle=e^{2\pi i2^k\phi}|\psi\rangle.
\]

**Derivation:** Apply U repeatedly. Each application multiplies the eigenvector by \(e^{2\pi i\phi}\), so applying it \(2^k\) times raises that eigenvalue to the power \(2^k\). The inverse QFT converts these phase rotations into a binary estimate of \(\phi\).


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is phase estimation?
   **Answer:** Estimating a phase φ when U|ψ⟩=e^{2πiφ}|ψ⟩.

2. **Question:** What is an eigenvector?
   **Answer:** A vector that changes only by a scalar under an operator.

3. **Question:** What is phase kickback in QPE?
   **Answer:** Controlled powers of U encode phase information in a control register.

4. **Question:** Which transform is applied at the end?
   **Answer:** The inverse QFT.

5. **Question:** What determines precision?
   **Answer:** The number of estimation qubits.

### Chapter quiz

1. What is phase estimation?

2. What is an eigenvector?

3. What is phase kickback in QPE?

4. Which transform is applied at the end?

5. What determines precision?

### Quiz answer key

1. **Estimating a phase φ when U|ψ⟩=e^{2πiφ}|ψ⟩.**

2. **A vector that changes only by a scalar under an operator.**

3. **Controlled powers of U encode phase information in a control register.**

4. **The inverse QFT.**

5. **The number of estimation qubits.**


---


# Chapter 9: Shor's Algorithm {#chapter-9-shor-s-algorithm}

## 2.1 Chapter overview

**Shor’s algorithm** is a quantum algorithm for integer factorization and discrete logarithms. This chapter focuses on integer factorization. Its significance comes from the fact that factoring large composite integers is believed to be difficult for classical computers but can be solved in polynomial time by a fault-tolerant quantum computer.

The algorithm does not factor an integer by trying every possible divisor. Instead, it converts factoring into a periodicity problem. The quantum part finds the order, or period, of a modular-exponentiation function:

\[
f(x)=a^x\bmod N,
\]

where \(N\) is the integer to be factored and \(a\) is chosen so that

\[
1<a<N,
\qquad
\gcd(a,N)=1.
\]

The **order** \(r\) of \(a\) modulo \(N\) is the smallest positive integer satisfying

\[
a^r\equiv1\pmod N.
\]

Once \(r\) is known, classical number theory can often recover nontrivial factors of \(N\) using

\[
\gcd(a^{r/2}-1,N)
\]

and

\[
\gcd(a^{r/2}+1,N).
\]

The quantum period-finding procedure uses:

- A superposition of exponents.
- Reversible modular exponentiation.
- Phase estimation or an equivalent period-finding circuit.
- The Quantum Fourier Transform.
- Measurement of a frequency related to \(k/r\).
- Continued-fraction classical post-processing.

A high-level workflow is

\[
N
\rightarrow
\text{choose }a
\rightarrow
\text{find order }r
\rightarrow
\text{use classical gcd calculations}
\rightarrow
\text{obtain factors}.
\]

Shor’s algorithm is a hybrid algorithm. The quantum computer estimates periodic information, while the classical computer performs random selection, continued fractions, greatest-common-divisor calculations, verification, and repetition when necessary.

---

## 2.2 Learning objectives

After studying this chapter, learners should be able to:

1. State the integer-factorization problem.
2. Explain how factoring is reduced to order finding.
3. Define modular arithmetic and multiplicative order.
4. Explain why \(\gcd(a,N)\neq1\) can immediately reveal a factor.
5. Describe the modular-exponentiation oracle.
6. Explain the role of QPE and the QFT in period finding.
7. Derive the measured phase values \(k/r\).
8. Use continued fractions to recover a candidate order.
9. Apply the classical gcd post-processing step.
10. Work through a complete example for \(N=15\).
11. Explain when an order-finding attempt fails.
12. Compare classical and quantum complexity.
13. Identify the assumptions behind Shor’s cryptographic significance.
14. Implement a small demonstration of the classical and quantum subroutines.

---

# 3. The integer-factorization problem

## 3.1 Composite integers

An integer \(N>1\) is **composite** if it can be written as a product of two smaller positive integers:

\[
N=pq,
\]

where

\[
1<p<N,
\qquad
1<q<N.
\]

The numbers \(p\) and \(q\) are factors of \(N\).

For example,

\[
15=3\times5.
\]

## 3.2 Prime numbers

A prime number has exactly two positive divisors: 1 and itself. If \(N\) is prime, it has no nontrivial factors.

Shor’s algorithm is intended for composite integers. A preliminary classical test can determine whether \(N\) is prime or has small obvious factors.

## 3.3 Factoring versus multiplication

Multiplication is efficient on classical computers. Given \(p\) and \(q\), calculating \(pq\) is straightforward. Factoring reverses this process: given \(N\), recover \(p\) and \(q\).

The apparent asymmetry between multiplication and factoring is important in public-key cryptography.

## 3.4 The factoring objective

Given a composite integer \(N\), find a nontrivial divisor \(d\) satisfying

\[
1<d<N,
\qquad
N\bmod d=0.
\]

Once one factor \(d\) is found, the complementary factor is

\[
N/d.
\]

---

# 4. Key definitions

## 4.1 Modular arithmetic

The expression

\[
x\equiv y\pmod N
\]

means that \(x-y\) is divisible by \(N\). Equivalently,

\[
x\bmod N=y\bmod N.
\]

For example,

\[
17\equiv2\pmod5.
\]

## 4.2 Coprime integers

Two integers are **coprime** if their greatest common divisor is 1:

\[
\gcd(a,N)=1.
\]

If \(a\) is not coprime with \(N\), then

\[
\gcd(a,N)>1
\]

is already a nontrivial factor of \(N\).

## 4.3 Multiplicative order

The **multiplicative order** of \(a\) modulo \(N\) is the smallest positive integer \(r\) such that

\[
a^r\equiv1\pmod N.
\]

It is written as

\[
\operatorname{ord}_N(a)=r.
\]

The order exists when \(\gcd(a,N)=1\).

## 4.4 Period

A **period** of a function is a positive integer that reproduces the function value. For modular exponentiation,

\[
a^{x+r}\equiv a^x\pmod N
\]

when

\[
a^r\equiv1\pmod N.
\]

Thus, the order \(r\) is the period of \(a^x\bmod N\).

## 4.5 Order-finding problem

The **order-finding problem** is: given \(a\) and \(N\) with \(\gcd(a,N)=1\), find the smallest positive \(r\) satisfying

\[
a^r\equiv1\pmod N.
\]

## 4.6 Continued fraction

A **continued fraction** represents a rational number as nested integer fractions. The continued-fraction expansion of a real number can reveal a nearby rational approximation

\[
\frac{k}{r}.
\]

Shor’s algorithm uses continued fractions to infer a candidate denominator \(r\) from a measured phase.

## 4.7 Modular inverse

The modular inverse of \(a\) modulo \(N\) is an integer \(a^{-1}\) satisfying

\[
aa^{-1}\equiv1\\pmod N.
\]

It exists exactly when \(\gcd(a,N)=1\).

---

# 5. From factoring to order finding

## 5.1 Modular-exponentiation function

Choose an integer \(a\) satisfying

\[
1<a<N,
\qquad
\gcd(a,N)=1.
\]

Define

\[
f(x)=a^x\bmod N.
\]

Because powers of \(a\) are taken modulo \(N\), the values eventually repeat.

## 5.2 Periodic behavior

If \(r\) is the order of \(a\) modulo \(N\), then

\[
a^r\equiv1\pmod N.
\]

Therefore,

\[
a^{x+r}
=a^xa^r
\equiv a^x	imes1
\equiv a^x\pmod N.
\]

Thus,

\[
f(x+r)=f(x).
\]

The function is periodic with period \(r\).

## 5.3 Why the order helps factor N

Suppose \(r\) is even. Then

\[
a^r-1\equiv0\pmod N.
\]

Factor the left-hand side:

\[
a^r-1
=(a^{r/2}-1)(a^{r/2}+1).
\]

Therefore,

\[
(a^{r/2}-1)(a^{r/2}+1)\equiv0\pmod N.
\]

Under favorable conditions, the two factors share nontrivial divisibility with \(N\). Compute

\[
p=\gcd(a^{r/2}-1,N),
\]

and

\[
q=\gcd(a^{r/2}+1,N).
\]

These may produce nontrivial factors.

## 5.4 Required conditions

The standard post-processing succeeds when:

1. \(r\) is even.
2. \(a^{r/2}\not\equiv-1\pmod N\).
3. The resulting gcd values are nontrivial.

If any condition fails, choose another \(a\) or repeat the procedure.

---

# 6. Classical pre-processing

## 6.1 Check for obvious factors

Before using the quantum circuit:

1. Test whether \(N\) is even.
2. Check small prime divisors.
3. Check whether \(N\) is a perfect power.
4. Choose a random \(a\) with \(1<a<N\).

If \(N\) is even,

\[
2
\]

is already a factor.

## 6.2 Greatest common divisor test

Calculate

\[
g=\gcd(a,N).
\]

If

\[
g>1,
\]

then \(g\) is a nontrivial factor and no quantum period-finding step is needed for that attempt.

If

\[
g=1,
\]

continue to order finding.

## 6.3 Perfect powers

If

\[
N=b^c
\]

for integers \(b>1\) and \(c>1\), classical methods can sometimes factor \(N\) efficiently. Such cases can be removed before the main procedure.

## 6.4 Why random selection is used

Different values of \(a\) have different orders modulo \(N\). Some orders are useful for factor recovery, while others produce failure conditions. Random selection and repetition provide a high probability of finding a useful order.

---

# 7. The order-finding quantum circuit

## 7.1 Registers

A period-finding circuit uses two registers:

- An exponent register with \(t\) qubits.
- A function-value register large enough to store residues modulo \(N\).

The exponent register is initialized in

\[
|0\rangle^{\otimes t},
\]

and the function register is initialized in a state representing \(|1\rangle\) or another suitable modular-arithmetic starting state.

## 7.2 Modular-exponentiation unitary

The central unitary acts as

\[
U_a|x\rangle|y\rangle
=|x\rangle|ya^xmod N\rangle,
\]

or, in an additive reversible-oracle convention,

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

The multiplication form is natural for modular exponentiation, while the exact reversible representation depends on the circuit construction.

## 7.3 Superposition of exponents

Apply Hadamards to the exponent register:

\[
|0\rangle^{\otimes t}
\mapsto
\frac1{\sqrt{2^t}}
\sum_{x=0}^{2^t-1}|x\rangle.
\]

The register now contains all exponent values in superposition.

## 7.4 Coherent modular exponentiation

The modular-exponentiation operation produces

\[
\frac1{\sqrt{2^t}}
\sum_x|x\rangle|a^xmod N\rangle.
\]

The periodicity of \(a^x\bmod N\) is now encoded in the joint quantum state.

## 7.5 Measurement and periodic superposition

Measuring the function-value register produces one residue and collapses the exponent register into a superposition of values separated by the period \(r\):

\[
\frac1{\sqrt L}
\sum_j|x_0+jr\rangle,
\]

where the sum includes the valid exponents in the register range.

The quantum Fourier transform is then applied to the exponent register.

---

# 8. Connection to quantum phase estimation

## 8.1 Eigenstates of modular multiplication

Define the modular multiplication operator

\[
M_a|y\rangle=|aymod N\rangle.
\]

Because \(\gcd(a,N)=1\), this operation is a permutation of the invertible residues and is reversible.

Repeated application gives

\[
M_a^x|y\rangle=|a^xymod N\rangle.
\]

## 8.2 Eigenvalues and order

The operator \(M_a\) has eigenvalues related to the order \(r\). On suitable eigenstates, the eigenvalues have the form

\[
e^{2\pi ik/r}

or k=0,1,\ldots,r-1.
\]

QPE applied to \(M_a\) estimates a phase

\[
\frac{k}{r}.
\]

This is the QPE interpretation of period finding.

## 8.3 Measured phase

The measurement produces an integer \(c\) such that

\[
\frac{c}{Q}\approx\frac{k}{r},
\]

where

\[
Q=2^t
\]

is the size of the exponent-register Fourier grid.

## 8.4 Recovering the denominator

The classical continued-fraction algorithm processes

\[
\frac{c}{Q}
\]

to find a candidate denominator \(r'
\). The candidate must then be verified by checking

\[
a^{r'}mod N=1.
\]

---

# 9. The Quantum Fourier Transform stage

## 9.1 Fourier transform of a periodic state

Suppose the exponent register contains

\[
|\psi\rangle
=\frac1{\sqrt L}
\sum_{j=0}^{L-1}|x_0+jr\rangle.
\]

Applying \(F_Q\) gives amplitudes proportional to

\[
\sum_{j=0}^{L-1}
 e^{2\pi i(x_0+jr)c/Q}.
\]

Factor out the initial phase:

\[
e^{2\pi ix_0c/Q}
\sum_{j=0}^{L-1}
 e^{2\pi ijrc/Q}.
\]

This geometric sum is large when

\[
\frac{rc}{Q}
\]

is close to an integer. Thus, measurement concentrates near

\[
\frac{c}{Q}\approx\frac{k}{r}.
\]

## 9.2 Period information

The QFT does not usually return \(r\) directly. It returns a frequency sample whose rational approximation has denominator related to \(r\).

## 9.3 Inverse QFT convention

Some formulations use an inverse QFT depending on how the phase is encoded and on the circuit convention. The essential requirement is consistent use of the Fourier sign and register ordering.

---

# 10. Continued fractions and classical post-processing

## 10.1 Rational approximation

Suppose measurement returns \(c\) from a register of size \(Q=2^t\). The useful approximation is

\[
\frac{c}{Q}\approx\frac{k}{r}.
\]

The continued-fraction expansion of \(c/Q\) produces convergents

\[
\frac{p_0}{q_0},
\frac{p_1}{q_1},
\ldots.
\]

A denominator \(q_j\) is a candidate for \(r\).

## 10.2 Verification

For each candidate denominator \(r'
\):

1. Compute \(a^{r'}\bmod N\).
2. Accept it as an order candidate if the result equals 1.
3. Check whether it is the smallest positive valid exponent.

A denominator may recover only a divisor of the true order, especially when \(\gcd(k,r)\neq1\). Repeated samples or least-common-multiple calculations may be needed.

## 10.3 Error condition

Continued fractions can recover the exact rational \(k/r\) when the approximation is sufficiently accurate. A standard sufficient condition is

\[
\left|\frac{c}{Q}-\frac{k}{r}\right|<\frac{1}{2r^2}.
\]

The exponent register is chosen large enough to make this condition likely.

## 10.4 Coprime numerator condition

If

\[
\gcd(k,r)=1,
\]

then the reduced fraction \(k/r\) has denominator exactly \(r\). If the numerator and denominator share a factor, continued fractions may return a reduced denominator smaller than \(r\).

---

# 11. Classical factor recovery

## 11.1 Even-order condition

Suppose the order \(r\) has been recovered and is even. Define

\[
x=a^{r/2}mod N.
\]

Since

\[
a^r\equiv1
egmod N,
\]

we have

\[
x^2\equiv1
egmod N.
\]

Thus,

\[
(x-1)(x+1)\equiv0
egmod N.
\]

## 11.2 GCD factors

Calculate

\[
p=\gcd(x-1,N),
\]

and

\[
q=\gcd(x+1,N).
\]

Equivalently,

\[
p=\gcd(a^{r/2}-1,N),
\]

\[
q=\gcd(a^{r/2}+1,N).
\]

If both are nontrivial, they factor \(N\).

## 11.3 Failure cases

The attempt fails when:

- \(r\) is odd.
- \(a^{r/2}\equiv-1
egmod N\).
- One gcd equals 1.
- One gcd equals \(N\).
- The recovered denominator is not the true order.
- The measured phase does not have sufficient precision.

Failure does not mean the algorithm is incorrect. Choose a new \(a\), repeat phase estimation, or collect additional samples.

---

# 12. Complete worked example: factoring 15

## 12.1 Choose \(N=15\)

We want to factor

\[
N=15.
\]

Choose

\[
a=2.
\]

Since

\[
\gcd(2,15)=1,
\]

we continue.

## 12.2 Calculate the order classically for verification

The powers of 2 modulo 15 are

\[
2^1=2
egmod15,
\]

\[
2^2=4
egmod15,
\]

\[
2^3=8
egmod15,
\]

\[
2^4=16
equiv1
egmod15.
\]

Therefore,

\[
r=4.
\]

In the real algorithm, the quantum period-finding subroutine is used to discover this period.

## 12.3 Periodic function

The function values begin

\[
2^xmod15:
\quad1,2,4,8,1,2,4,8,\ldots
\]

The period is 4.

## 12.4 Fourier samples

The phase-finding procedure produces values near

\[
\frac{k}{4},
\qquad k=0,1,2,3.
\]

Possible ideal phase fractions include

\[
0,
\quad\frac14,
\quad\frac12,
\quad\frac34.
\]

Suppose the measured value corresponds to

\[
\frac{c}{Q}\approx\frac14.
\]

Continued fractions return the candidate denominator

\[
r'=4.
\]

## 12.5 Recover factors

Calculate

\[
x=2^{4/2}mod15=2^2mod15=4.
\]

Then

\[
\gcd(4-1,15)=\gcd(3,15)=3,
\]

and

\[
\gcd(4+1,15)=\gcd(5,15)=5.
\]

Therefore,

\[
15=3\times5.
\]

---

# 13. A failure example

## 13.1 Choose \(N=15\), \(a=4\)

The powers are

\[
4^1=4
egmod15,
\]

\[
4^2=16
equiv1
egmod15.
\]

The order is

\[
r=2.
\]

This order is even, but

\[
4^{r/2}=4^1=4
ot\equiv-1
egmod15,
\]

so this particular attempt actually succeeds:

\[
\gcd(4-1,15)=3,
\]

\[
\gcd(4+1,15)=5.
\]

## 13.2 A genuine failure condition

If an order satisfies

\[
a^{r/2}\equiv-1
egmod N,
\]

then

\[
\gcd(a^{r/2}+1,N)=N,
\]

and

\[
\gcd(a^{r/2}-1,N)=1
\]

may provide no nontrivial factors. Choose a different \(a\) and repeat.

## 13.3 Odd order

If \(r\) is odd, \(r/2\) is not an integer and the standard factor-recovery step cannot be applied. Select another base.

---

# 14. Complexity analysis

## 14.1 Classical factoring

The best known classical factoring algorithms are subexponential for general large integers, but not known to run in polynomial time. Trial division requires exponential time in the bit length in the worst case.

If \(n=\lceil\log_2N\rceil\) is the input length, a polynomial-time algorithm would have runtime \(O(n^k)\) for some fixed \(k\). Classical general-purpose factoring is not known to have such a runtime.

## 14.2 Quantum complexity

Shor’s algorithm runs in polynomial time in the number of bits of \(N\), assuming:

- Efficient reversible modular arithmetic.
- Fault-tolerant quantum gates.
- Sufficiently accurate phase estimation.
- Efficient classical post-processing.

The main quantum resource is the modular-exponentiation circuit, not only the QFT.

## 14.3 QFT cost

For an exponent register of \(t\) qubits, the exact QFT uses

\[
O(t^2)
\]

gates.

## 14.4 Modular arithmetic cost

Reversible modular multiplication and exponentiation require many elementary gates. Their asymptotic cost depends on the arithmetic construction and gate set.

## 14.5 Repetition cost

A single phase sample may return a reduced fraction or an unusable value. The algorithm repeats the order-finding procedure until factor recovery succeeds.

---

# 15. Cryptographic significance

## 15.1 RSA assumption

RSA security relies on the practical difficulty of factoring a large composite modulus

\[
N=pq.
\]

The public key contains \(N\) and an exponent, while the private key depends on information related to \(p\) and \(q\).

## 15.2 Effect of Shor’s algorithm

A sufficiently large fault-tolerant quantum computer running Shor’s algorithm could factor RSA moduli in polynomial time. This would compromise the computational assumption behind RSA.

## 15.3 Discrete logarithms

Shor’s broader framework also solves discrete-logarithm problems in polynomial time. This affects cryptosystems based on:

- Finite-field discrete logarithms.
- Elliptic-curve discrete logarithms.

## 15.4 Current practical qualification

The existence of a polynomial-time algorithm does not mean that current quantum hardware can factor cryptographically large integers. The required fault-tolerant resources are substantial, including:

- Many logical qubits.
- Error correction.
- Long coherent circuits.
- Accurate modular arithmetic.
- Large numbers of physical gates.

---

# 16. Implementation and simulation

## 16.1 High-level pseudocode

```text
function Shor(N):
    handle trivial cases such as even N or perfect powers

    repeat:
        choose random a with 1 < a < N
        g = gcd(a, N)
        if g > 1:
            return g and N/g

        use quantum order-finding to estimate r = ord_N(a)

        if r is odd:
            continue

        x = a^(r/2) mod N
        if x == N - 1:
            continue

        p = gcd(x - 1, N)
        q = gcd(x + 1, N)

        if p and q are nontrivial:
            return p, q
```

## 16.2 Small simulator workflow

For a small demonstration:

1. Choose a small composite \(N\), such as 15.
2. Choose a coprime base \(a\), such as 2.
3. Build reversible modular exponentiation.
4. Create a superposition of exponents.
5. Apply modular exponentiation.
6. Apply the QFT or inverse QFT to the exponent register.
7. Measure and obtain \(c/Q\).
8. Use continued fractions.
9. Verify candidate order \(r\).
10. Calculate the gcd factors.

## 16.3 Classical demonstration

Before implementing the quantum circuit, calculate the period table classically:

```text
for x in range(Q):
    value = pow(a, x, N)
    record value
find the smallest positive r such that a^r mod N == 1
```

This does not demonstrate quantum speedup, but it verifies the arithmetic and provides a reference for the circuit.

## 16.4 Register ordering

QFT and phase-estimation implementations may output bit-reversed strings. Always document:

- Which qubit is least significant.
- Whether QFT swaps are included.
- How classical bits map to measured qubits.
- How the integer \(c\) is reconstructed.

## 16.5 Noise considerations

Noise can affect:

- Modular-exponentiation gates.
- Controlled powers.
- QFT rotations.
- Measurement distributions.
- Continued-fraction candidate selection.

For noisy demonstrations, collect many shots and verify candidate orders classically.

---

# 17. Common misconceptions

## Misconception 1: Shor’s algorithm directly searches for factors

The main quantum task is order finding. Classical number theory converts the order into factors.

## Misconception 2: The QFT alone factors integers

The QFT extracts periodic information, but modular exponentiation, state preparation, measurement, continued fractions, and gcd calculations are also required.

## Misconception 3: Every measured phase directly equals \(1/r\)

The phase is generally near \(k/r\) for a random numerator \(k\). Continued fractions and verification are needed to recover \(r\).

## Misconception 4: Every order succeeds

Odd orders and the condition \(a^{r/2}\equiv-1\pmod N\) can cause failure. The algorithm repeats with another base or another measurement.

## Misconception 5: Factoring 15 proves RSA is broken today

Small demonstrations illustrate the algorithm but do not represent the large fault-tolerant resources needed for cryptographic sizes.

## Misconception 6: The quantum computer performs all classical arithmetic automatically

Random selection, gcd calculations, continued fractions, candidate verification, and repetition are classical parts of the algorithm.

## Misconception 7: A phase-estimation result is always exact

Finite register size, measurement statistics, approximate eigenstates, and noise affect the estimate.

## Misconception 8: A polynomial quantum algorithm means a small practical circuit

Polynomial scaling may still involve large constants, substantial error-correction overhead, and deep modular-arithmetic circuits.

---

# 18. Chapter summary

Shor’s algorithm factors a composite integer by reducing factoring to the problem of finding a modular-multiplication order.

For a chosen base \(a\) coprime to \(N\), define

\[
f(x)=a^x\bmod N.
\]

The order \(r\) is the smallest positive integer satisfying

\[
a^r\equiv1
egmod N.
\]

If \(r\) is even and

\[
a^{r/2}
ot\equiv-1
egmod N,
\]

then factors can be obtained from

\[
\gcd(a^{r/2}-1,N)
\]

and

\[
\gcd(a^{r/2}+1,N).
\]

The quantum order-finding subroutine creates a superposition of exponents, performs reversible modular exponentiation, and applies a QFT or inverse QFT. Measurement produces a fraction near

\[
\frac{k}{r}.
\]

Continued fractions recover a candidate denominator, and classical modular arithmetic verifies the order.

For \(N=15\) and \(a=2\), the order is \(r=4\), and the factor-recovery step gives

\[
\gcd(2^2-1,15)=3,
\]

\[
\gcd(2^2+1,15)=5.
\]

Thus,

\[
15=3\times5.
\]

Shor’s algorithm is theoretically polynomial in the bit length of \(N\), but practical implementation requires fault-tolerant quantum hardware, accurate modular arithmetic, long coherent circuits, and substantial error-correction resources.

---

# 19. Formula sheet

Modular-exponentiation function:

\[
f(x)=a^x\bmod N.
\]

Coprime condition:

\[
\gcd(a,N)=1.
\]

Order definition:

\[
a^r\equiv1\pmod N.
\]

Periodicity:

\[
a^{x+r}\equiv a^x\pmod N.
\]

Factorization identity:

\[
a^r-1=(a^{r/2}-1)(a^{r/2}+1).
\]

Factor-recovery gcds:

\[
p=\gcd(a^{r/2}-1,N),
\]

\[
q=\gcd(a^{r/2}+1,N).
\]

Phase sample:

\[
\frac{c}{Q}\approx\frac{k}{r}.
\]

Fourier-register size:

\[
Q=2^t.
\]

Continued-fraction accuracy condition:

\[
\left|\frac{c}{Q}-\frac{k}{r}\right|<\frac1{2r^2}.
\]

Exact QFT cost on \(t\) qubits:

\[
O(t^2).
\]

---

# 20. Review questions and exercises

## Conceptual questions

1. What problem does Shor’s algorithm solve?
2. What is the order of \(a\) modulo \(N\)?
3. Why must \(a\) be chosen coprime to \(N\)?
4. How does factoring reduce to order finding?
5. Why must the recovered order be even?
6. What failure occurs when \(a^{r/2}\equiv-1\pmod N\)?
7. What is the role of modular exponentiation?
8. How is QPE connected to order finding?
9. Why are measured phases near \(k/r\)?
10. What do continued fractions do?
11. Why can a candidate denominator be smaller than the true order?
12. What classical calculations complete the algorithm?
13. Why is Shor’s algorithm significant for RSA?
14. Why are small demonstrations not equivalent to breaking large RSA keys?

## Numerical exercises

1. Calculate the order of 2 modulo 15.
2. Calculate the order of 7 modulo 15.
3. Calculate the powers of 2 modulo 15 for \(x=0,1,2,3,4\).
4. For \(N=15\), \(a=2\), calculate the two factor-recovery gcds.
5. Verify that \(a^{x+r}\equiv a^x\pmod N\) when \(r\) is the order.
6. Calculate \(c/Q\) for \(c=5\) and \(Q=16\).
7. Find the continued-fraction convergents of a simple phase fraction such as 5/16.
8. Test whether a candidate \(r'=4\) is an order for \(a=2\), \(N=15\).
9. Explain what happens when the recovered denominator is a divisor of the true order.
10. Calculate the QFT gate complexity for an exponent register with 8, 16, and 32 qubits.

## Circuit exercises

Draw and analyze:

1. The modular-exponentiation circuit for \(N=15\), \(a=2\), on a small register.
2. The exponent superposition circuit.
3. The QFT stage of period finding.
4. The inverse-QFT stage of QPE-based order finding.
5. A phase-estimation circuit producing fractions near \(k/4\).
6. The classical continued-fraction post-processing flow.

For each circuit:

- Identify exponent and function-value registers.
- Explain the periodic state.
- Track the role of the QFT.
- Interpret a measured phase.
- Verify a candidate order classically.

## Programming activity

Using Qiskit, Cirq, PennyLane, or another framework:

1. Implement classical order finding for small \(N\).
2. Build a small modular-exponentiation truth table.
3. Implement a toy period-finding circuit.
4. Run QFT-based sampling for \(N=15\), \(a=2\).
5. Apply continued fractions to measured fractions.
6. Verify candidate orders by modular exponentiation.
7. Calculate factors with gcd.
8. Test failure cases and repeat with different bases.
9. Compare ideal and noisy phase distributions.
10. Document register ordering and bit-reversal conventions.

---

# 21. Glossary

**Continued fraction:** A classical representation used to recover rational approximations from measured phase ratios.

**Factoring:** Finding nontrivial divisors of a composite integer.

**Modular exponentiation:** Computing \(a^x\bmod N\) for an exponent \(x\).

**Order:** The smallest positive \(r\) satisfying \(a^r\equiv1\pmod N\).

**Period finding:** Determining the repetition interval of a modular-exponentiation function.

**Quantum Fourier Transform:** The quantum operation that converts periodic phase information into measurable frequency information.

**Shor’s algorithm:** A quantum algorithm that factors integers by using quantum order finding and classical number theory.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1109/SFCS.1994.365700 "Algorithms for quantum computation: discrete logarithms and factoring"

[4]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[5]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

[6]: https://doi.org/10.1103/PhysRevLett.81.3071 "Strengths and weaknesses of quantum computing"

## Key formulas: derivation and interpretation

### Period-finding function

\[
f(x)=a^x\bmod N.
\]

The period r is the smallest positive integer satisfying:

\[
a^r\equiv1\pmod N.
\]

**Derivation:** Modular exponentiation repeats because there are finitely many residues relatively prime to N. The quantum period-finding circuit creates a superposition of x values, evaluates the function coherently, and uses the QFT to reveal information about multiples of \(1/r\). Classical continued fractions then recover r.

When r is even and suitable conditions hold:

\[
\gcd(a^{r/2}-1,N)\quad\text{and}\quad\gcd(a^{r/2}+1,N)
\]

can reveal nontrivial factors of N.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What problem does Shor’s algorithm address?
   **Answer:** Integer factorization and related period-finding problems.

2. **Question:** What function is used for period finding?
   **Answer:** f(x)=a^x mod N.

3. **Question:** What is r?
   **Answer:** The order or period satisfying a^r≡1 mod N.

4. **Question:** What quantum tool finds r?
   **Answer:** Quantum phase estimation or the QFT-based period-finding circuit.

5. **Question:** What follows the quantum circuit?
   **Answer:** Classical continued-fraction and greatest-common-divisor post-processing.

### Chapter quiz

1. What problem does Shor’s algorithm address?

2. What function is used for period finding?

3. What is r?

4. What quantum tool finds r?

5. What follows the quantum circuit?

### Quiz answer key

1. **Integer factorization and related period-finding problems.**

2. **f(x)=a^x mod N.**

3. **The order or period satisfying a^r≡1 mod N.**

4. **Quantum phase estimation or the QFT-based period-finding circuit.**

5. **Classical continued-fraction and greatest-common-divisor post-processing.**


---


# Chapter 10: Quantum Walk Algorithms {#chapter-10-quantum-walk-algorithms}

## 3.1 Chapter overview

A **quantum walk** is the quantum analogue of a classical random walk. It describes the evolution of a quantum state over the vertices, edges, or configurations of a graph. Quantum walks use superposition, interference, and sometimes entanglement to explore a graph in ways that differ fundamentally from classical random processes.

Quantum walk algorithms are useful for:

- Searching graphs and databases.
- Detecting marked vertices.
- Evaluating graph properties.
- Modeling physical transport.
- Designing quantum search algorithms.
- Developing algorithms for element distinctness.
- Studying hitting times and mixing behavior.
- Constructing quantum speedups for structured problems.

A classical random walk moves probabilistically from one vertex to another. A quantum walk evolves through unitary amplitudes. Amplitudes associated with different paths can interfere constructively or destructively, changing the probability of reaching a destination.

There are two main models:

1. **Discrete-time quantum walks**, which use a step-by-step unitary operator, often with a coin register.
2. **Continuous-time quantum walks**, which evolve continuously under a Hamiltonian derived from the graph.

A classical random walk can be described by a transition matrix \(P\). A continuous-time quantum walk can be described by

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle,
\]

where \(H\) is a graph-dependent Hamiltonian. A discrete-time walk uses a unitary step operator such as

\[
W=S(C\otimes I),
\]

where \(C\) is a coin operation and \(S\) shifts the walker according to the coin state.

Quantum walks are related to amplitude amplification and phase estimation. The eigenvalues of a walk operator encode graph information, and QPE can estimate the corresponding eigenphases. This makes quantum walks a natural topic after studying the Quantum Fourier Transform, phase estimation, and Shor’s algorithm.

---

## 3.2 Learning objectives

After studying this chapter, learners should be able to:

1. Define classical and quantum walks.
2. Compare probabilistic transitions with unitary evolution.
3. Explain the role of graphs in quantum-walk algorithms.
4. Describe discrete-time coined quantum walks.
5. Describe continuous-time quantum walks.
6. Construct a coin operator and shift operator.
7. Explain interference between different walk paths.
8. Define hitting time and mixing behavior.
9. Describe quantum-walk search algorithms.
10. Explain the role of marked vertices.
11. Connect quantum-walk eigenphases to phase estimation.
12. Analyze simple walks on a line and a cycle.
13. Discuss Szegedy quantum walks.
14. Implement a small quantum walk circuit or simulation.
15. Identify practical limitations and measurement considerations.

---

# 4. Graphs and classical random walks

## 4.1 Graph definition

A graph is a mathematical structure

\[
G=(V,E),
\]

where:

- \(V\) is a set of vertices.
- \(E\) is a set of edges connecting vertices.

A vertex represents a position, state, or candidate. An edge represents an allowed transition.

## 4.2 Adjacency matrix

The adjacency matrix \(A\) of an unweighted graph is defined by

\[
A_{xy}=
\begin{cases}
1,&(x,y)\in E,\\
0,&(x,y)\notin E.
\end{cases}
\]

For an undirected graph, \(A\) is symmetric:

\[
A=A^T.
\]

## 4.3 Degree matrix

The degree of vertex \(x\), written \(d_x\), is the number of edges incident to it. The degree matrix is diagonal:

\[
D_{xx}=d_x.
\]

## 4.4 Transition matrix

For a simple random walk on a regular graph, the walker moves uniformly to a neighboring vertex. The transition matrix is

\[
P_{xy}=\Pr(X_{t+1}=y\mid X_t=x).
\]

For a \(d\)-regular graph,

\[
P=\frac1dA.
\]

For an irregular graph,

\[
P=D^{-1}A.
\]

## 4.5 Classical probability distribution

A classical distribution is a vector

\[
p(t)=egin{bmatrix}p_0(t)&p_1(t)&\cdots&p_{|V|-1}(t)\end{bmatrix}^T,
\]

where

\[
p_x(t)\ge0,
\qquad
\sum_xp_x(t)=1.
\]

The distribution evolves as

\[
p(t+1)=P^Tp(t)
\]

or \(p(t+1)=Pp(t)\), depending on the row- or column-vector convention.

## 4.6 Classical random walk on a line

At each step, a walker on an infinite line moves left or right with probability 1/2:

\[
P(X_{t+1}=x-1\mid X_t=x)=\frac12,
\]

\[
P(X_{t+1}=x+1\mid X_t=x)=\frac12.
\]

The distribution spreads diffusively. A typical distance from the starting point grows as

\[
O(\sqrt t).
\]

---

# 5. Key definitions

## 5.1 Quantum walk

A **quantum walk** is a unitary evolution of a quantum state over the vertices, edges, or directed arcs of a graph.

## 5.2 Position register

The **position register** stores the current vertex of the walker:

\[
|x\rangle.
\]

## 5.3 Coin register

In a discrete-time coined walk, the **coin register** determines the direction or edge chosen for the next step.

## 5.4 Coin operator

A **coin operator** is a unitary operation that creates a superposition of possible movement directions. The Hadamard coin is commonly used for a two-direction walk:

\[
H=\frac1{\sqrt2}
\begin{bmatrix}
1&1\\
1&-1
\end{bmatrix}.
\]

## 5.5 Shift operator

A **shift operator** moves the position based on the coin state. For a line,

\[
S|0\rangle|x\rangle=|0\rangle|x-1\rangle,
\]

\[
S|1\rangle|x\rangle=|1\rangle|x+1\rangle.
\]

## 5.6 Walk operator

A discrete-time walk step is commonly written

\[
W=S(C\otimes I).
\]

The coin acts first, followed by the conditional shift.

## 5.7 Marked vertex

A **marked vertex** is a vertex satisfying a search condition. A walk algorithm may modify the evolution at marked vertices to amplify their probability.

## 5.8 Hitting time

The **hitting time** is the time required for a walk to reach a target or marked set according to a chosen success criterion.

## 5.9 Mixing

**Mixing** describes how a walk approaches a stationary or nearly stationary distribution. Quantum walks do not always converge in the same way as classical random walks because unitary evolution is reversible and can oscillate.

## 5.10 Spectral gap

The **spectral gap** is a difference between leading eigenvalues of an operator. It influences mixing, propagation, and search performance.

---

# 6. Discrete-time coined quantum walks

## 6.1 Hilbert space

A coined quantum walk uses the joint space

\[
\mathcal H=\mathcal H_C\otimes\mathcal H_P,
\]

where:

- \(\mathcal H_C\) is the coin space.
- \(\mathcal H_P\) is the position space.

For a walk on a line, the coin has two states and the position basis is

\[
\{|x\rangle:x\in\mathbb Z\}.
\]

A basis state is

\[
|c\rangle|x\rangle.
\]

## 6.2 Coin step

The coin creates a superposition of directions. With a Hadamard coin,

\[
H|0\rangle=\frac{|0\rangle+|1\rangle}{\sqrt2},
\]

\[
H|1\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

The minus sign in the second transformation creates relative phase differences.

## 6.3 Conditional shift

The shift operator moves the walker according to the coin value:

\[
S|0,x\rangle=|0,x-1\rangle,
\]

\[
S|1,x\rangle=|1,x+1\rangle.
\]

## 6.4 One-step operator

The complete step is

\[
W=S(H\otimes I_P).
\]

For a general coin \(C\),

\[
W=S(C\otimes I_P).
\]

Because both \(S\) and \(C\otimes I_P\) are unitary, \(W\) is unitary.

## 6.5 State after one step

Start with

\[
|\psi_0\rangle=|0\rangle_C|0\rangle_P.
\]

Apply H:

\[
(H\otimes I)|\psi_0\rangle
=\frac{|0,0\rangle+|1,0\rangle}{\sqrt2}.
\]

Apply S:

\[
|\psi_1\rangle
=\frac{|0,-1\rangle+|1,+1\rangle}{\sqrt2}.
\]

The walker is found at -1 or +1 with equal probability after measuring position.

## 6.6 State after two steps

Apply the coin to each branch:

\[
|\psi_1\rangle
=\frac{|0,-1\rangle+|1,+1\rangle}{\sqrt2}.
\]

The coin operation gives

\[
\frac{1}{2}
\left(|0,-1\rangle+|1,-1\rangle
+|0,+1\rangle-|1,+1\rangle\right).
\]

After shifting,

\[
|\psi_2\rangle
=\frac12
\left(|0,-2\rangle+|1,0\rangle
+|0,0\rangle-|1,+2\rangle\right).
\]

At position 0, two paths contribute with different coin labels. Further steps create interference patterns.

---

# 7. Interference in quantum walks

## 7.1 Path amplitudes

A position can be reached through multiple paths. Quantum mechanics adds amplitudes rather than probabilities:

\[
A(x)=\sum_{\text{paths to }x}A(\text{path}).
\]

The probability is

\[
P(x)=|A(x)|^2.
\]

## 7.2 Constructive interference

If path amplitudes have matching phase, they reinforce:

\[
A_1+A_2> A_1
\]

in magnitude for suitable positive phases.

## 7.3 Destructive interference

If path amplitudes have opposite phase, they can cancel:

\[
A_1+(-A_1)=0.
\]

This can make some positions unlikely even when many paths reach them.

## 7.4 Difference from a classical walk

A classical random walk adds probabilities. A quantum walk adds amplitudes first and squares afterward. This difference changes the spread, symmetry, hitting behavior, and algorithmic performance.

## 7.5 Ballistic spreading

For a standard quantum walk on a line, the distribution can spread over a distance of order

\[
O(t)
\]

after \(t\) steps, compared with the classical diffusive scale

\[
O(\sqrt t).
\]

The exact distribution depends on the initial coin state and coin operator.

---

# 8. Quantum walk on a cycle

## 8.1 Cycle graph

A cycle with \(L\) vertices is denoted \(C_L\). Each vertex is connected to two neighbors:

\[
x\mapsto x-1\pmod L,
\qquad
x\mapsto x+1\pmod L.
\]

## 8.2 Position basis

The position states are

\[
|0\rangle,|1\rangle,\ldots,|L-1\rangle.
\]

The conditional shift becomes

\[
S|0,x\rangle=|0,x-1\pmod L\rangle,
\]

\[
S|1,x\rangle=|1,x+1\pmod L\rangle.
\]

## 8.3 Momentum basis

The cycle has Fourier momentum states

\[
|k\rangle
=\frac1{\sqrt L}
\sum_{x=0}^{L-1}e^{2\pi ikx/L}|x\rangle.
\]

The shift acts diagonally in this basis:

\[
S|0,k\rangle=e^{-2\pi ik/L}|0,k\rangle,
\]

\[
S|1,k\rangle=e^{2\pi ik/L}|1,k\rangle.
\]

This spectral representation helps analyze the walk operator.

## 8.4 Periodicity and recurrence

Because a finite cycle has a finite-dimensional unitary evolution, the distribution can show recurrences and oscillations. It does not necessarily converge to a classical stationary distribution.

---

# 9. Continuous-time quantum walks

## 9.1 Definition

A continuous-time quantum walk evolves under a Hamiltonian derived from the graph. The state is

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

The Hamiltonian may be the adjacency matrix:

\[
H=A,
\]

or the graph Laplacian:

\[
H=L=D-A.
\]

## 9.2 Schrödinger equation

The state satisfies

\[
i\frac{d}{dt}|\psi(t)\rangle=H|\psi(t)\rangle.
\]

For a time-independent Hamiltonian,

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

## 9.3 Adjacency-based walk

If \(H=A\), the amplitude at a vertex changes according to the graph connectivity. For a line, the adjacency matrix connects each position to its two neighbors.

## 9.4 Laplacian-based walk

The Laplacian is

\[
L=D-A.
\]

Using \(H=L\) can make the evolution invariant under certain graph transformations and is related to diffusion operators.

## 9.5 Spectral decomposition

If

\[
H|\lambda_j\rangle=\lambda_j|\lambda_j\rangle,
\]

then

\[
e^{-iHt}|\lambda_j\rangle=e^{-i\lambda_jt}|\lambda_j\rangle.
\]

A continuous-time quantum walk therefore encodes graph eigenvalues as phases. QPE can estimate these phases and reveal spectral information.

---

# 10. Discrete-time versus continuous-time walks

## 10.1 Discrete-time model

A discrete-time walk uses repeated applications of a step unitary:

\[
|\psi_t\rangle=W^t|\psi_0\rangle.
\]

It commonly requires a coin register.

## 10.2 Continuous-time model

A continuous-time walk uses Hamiltonian evolution:

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

It does not require a separate coin register in the basic formulation.

## 10.3 Comparison table

| Feature | Discrete-time walk | Continuous-time walk |
|---|---|---|
| Evolution | \(W^t\) | \(e^{-iHt}\) |
| Time | Integer steps | Continuous parameter |
| Extra coin | Usually required | Usually not required |
| Main operator | Coin plus shift | Graph Hamiltonian |
| Analysis | Unitary eigenvalues | Hamiltonian eigenvalues |
| Hardware mapping | Gate sequence | Hamiltonian simulation |

## 10.4 Relationship

The two models can simulate related behaviors, and constructions exist that convert between them under suitable conditions. They should not be assumed identical for every graph or algorithm.

---

# 11. Quantum-walk search algorithms

## 11.1 Marked-vertex search

Suppose a graph contains one or more marked vertices. The objective is to find a marked vertex by evolving a quantum walker and measuring its position.

A search walk modifies the evolution so that marked vertices receive a phase change or a special reflection.

## 11.2 Marking operation

A simple marking oracle is

\[
O_M|x\rangle=
\begin{cases}
-|x\rangle,&x\in M,\\
|x\rangle,&x\notin M,
\end{cases}
\]

where \(M\) is the marked set.

## 11.3 Search step

A discrete-time search step may be written

\[
W_M=SO_MC,
\]

or as a product of a walk operator and a marking reflection. The exact order depends on the algorithm.

## 11.4 Amplitude amplification viewpoint

The walk moves amplitude through the graph while the marking operation identifies valid locations. Repeated interference can increase the probability of measuring a marked vertex.

## 11.5 Complete-graph search

On a complete graph, quantum-walk search reproduces behavior closely related to Grover amplitude amplification. The graph connectivity allows rapid mixing between all candidates, while the marked-state phase produces amplification.

## 11.6 Graph-dependent performance

The search complexity depends on:

- Graph size.
- Degree distribution.
- Spectral gap.
- Number and arrangement of marked vertices.
- Initial state.
- Walk operator.
- Measurement time.

There is no single runtime formula that applies to every graph.

---

# 12. Hitting time and graph search

## 12.1 Classical hitting time

The classical hitting time from vertex \(u\) to a marked set \(M\) is the expected number of steps before the walk first reaches \(M\).

## 12.2 Quantum hitting behavior

Quantum walks can reach marked regions differently because amplitudes interfere. Quantum hitting-time definitions vary depending on measurement model and success criterion.

## 12.3 Repeated measurements

A unitary walk does not permanently absorb at a marked vertex unless a measurement or absorbing operation is introduced. One may:

- Measure after a fixed number of steps.
- Measure after every step.
- Add a marking phase and measure at the end.
- Use an absorbing boundary in a modified model.

These choices produce different performance measures.

## 12.4 Spectral dependence

Walk behavior is controlled by eigenvalues and eigenvectors of the walk or Hamiltonian. Spectral gaps often determine how rapidly information propagates or how effectively a search separates marked and unmarked subspaces.

---

# 13. Szegedy quantum walks

## 13.1 Classical Markov chain

Szegedy’s construction starts from a classical Markov chain with transition probabilities

\[
P_{xy}.
\]

The quantum walk encodes transition amplitudes into two registers.

## 13.2 Transition states

For each vertex \(x\), define

\[
|\psi_x\rangle
=|x\rangle\sum_y\sqrt{P_{xy}}|y\rangle.
\]

These states encode the classical transition probabilities as quantum amplitudes.

## 13.3 Reflections

The walk is built from reflections about subspaces generated by the transition states. A typical step has the form

\[
W=R_B R_A,
\]

where \(R_A\) and \(R_B\) are reflections.

## 13.4 Importance

Szegedy walks provide a general framework for quantizing Markov chains and can yield quadratic improvements for certain hitting and detection problems.

## 13.5 Relation to phase estimation

The eigenphases of the Szegedy walk encode information about the classical chain’s eigenvalues. QPE can estimate these eigenphases, enabling spectral and hitting-time analysis.

---

# 14. Quantum walks and phase estimation

## 14.1 Walk eigenvalues

Let \(W\) be a walk unitary with eigenstates

\[
W|\psi_j\rangle=e^{i\theta_j}|\psi_j\rangle.
\]

QPE can estimate the phases \(\theta_j\).

## 14.2 Graph spectral information

For a continuous-time walk with Hamiltonian \(H\),

\[
H|\lambda_j\rangle=\lambda_j|\lambda_j\rangle,
\]

and

\[
e^{-iHt}|\lambda_j\rangle=e^{-i\lambda_jt}|\lambda_j\rangle.
\]

The phase is related to the graph eigenvalue:

\[
\theta_j=-\lambda_jt\pmod{2\pi}.
\]

## 14.3 Why this connection matters

Quantum walks can be analyzed as spectral algorithms. Phase estimation can reveal:

- Eigenvalues.
- Spectral gaps.
- Mixing-related quantities.
- Markov-chain structure.
- Graph symmetries.

## 14.4 Walk-based algorithms as eigenphase algorithms

Many quantum-walk algorithms can be understood as manipulating eigenphases so that marked and unmarked components evolve differently. This is closely related to amplitude amplification and phase-based filtering.

---

# 15. Worked examples

## 15.1 One step on a line

Start with

\[
|\psi_0\rangle=|0\rangle_C|0\rangle_P.
\]

Apply H to the coin:

\[
|\psi'\rangle
=\frac{|0,0\rangle+|1,0\rangle}{\sqrt2}.
\]

Apply the shift:

\[
|\psi_1\rangle
=\frac{|0,-1\rangle+|1,+1\rangle}{\sqrt2}.
\]

Measuring position gives -1 or +1 with probability 1/2.

## 15.2 Two steps and interference

After two steps,

\[
|\psi_2\rangle
=\frac12
\left(|0,-2\rangle+|1,0\rangle+|0,0\rangle-|1,+2\rangle\right).
\]

The position probabilities are

\[
P(-2)=\frac14,
\qquad
P(0)=\frac12,
\qquad
P(+2)=\frac14.
\]

The coin labels remain part of the state, and later steps create additional interference.

## 15.3 Continuous-time walk on two vertices

For a two-vertex graph,

\[
A=
\begin{bmatrix}
0&1\\
1&0
\end{bmatrix}.
\]

Using \(H=A\),

\[
|\psi(t)\rangle=e^{-iAt}|0\rangle.
\]

Since \(A=X\),

\[
e^{-iAt}=\cos(t)I-i\sin(t)X.
\]

Therefore,

\[
|\psi(t)\rangle=\cos(t)|0\rangle-i\sin(t)|1\rangle.
\]

The probabilities are

\[
P(0)=\cos^2(t),
\qquad
P(1)=\sin^2(t).
\]

## 15.4 Marked vertex on a cycle

Consider a cycle with one marked vertex. Apply a phase flip at the marked vertex after each walk step. The marking changes the relative phase of paths that visit the target. Repeated evolution can increase the marked-vertex probability at selected times.

The optimal measurement time depends on the cycle size, coin operator, initial state, and marking rule.

## 15.5 Spectral phase example

If a walk operator has an eigenvalue

\[
e^{2\pi i\phi},
\]

then QPE can estimate \(\phi\). If the walk is generated by \(H\) for time \(t\), and the Hamiltonian eigenvalue is \(\lambda\), then

\[
e^{-i\lambda t}=e^{2\pi i\phi},
\]

so

\[
\phi=-\frac{\lambda t}{2\pi}\pmod1.
\]

---

# 16. Implementation and simulation

## 16.1 Discrete-time walk pseudocode

```text
function coined_walk(steps):
    prepare coin and position registers
    initialize position at the origin

    repeat steps times:
        apply coin operator C
        apply conditional shift S

    measure position
    return position distribution
```

## 16.2 Position encoding

For a finite line or cycle, encode the position in a binary register. The shift operation becomes modular addition or subtraction controlled by the coin qubit.

For a cycle of size \(L=2^m\):

\[
|0,x\rangle\mapsto|0,x-1\pmod L\rangle,
\]

\[
|1,x\rangle\mapsto|1,x+1\pmod L\rangle.
\]

## 16.3 Conditional shift implementation

A conditional shift can be built from:

- Controlled modular increment.
- Controlled modular decrement.
- Ancilla qubits for arithmetic.
- Reversible adders.

The gate count depends on the position-register size and arithmetic design.

## 16.4 Continuous-time simulation

For a small graph, construct the Hamiltonian matrix \(H\) and calculate

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

On a quantum circuit, approximate time evolution using product formulas:

\[
e^{-i(A+B)t}
\approx
\left(e^{-iA\Delta t}e^{-iB\Delta t}\right)^m,
\qquad
\Delta t=t/m.
\]

## 16.5 Search-walk simulation

1. Construct the graph.
2. Choose a marked vertex or marked set.
3. Implement the marking phase flip.
4. Apply walk steps and marking operations.
5. Measure the position at different times.
6. Plot the marked probability.
7. Compare with a classical random walk.

## 16.6 Noise considerations

Quantum walks may require many controlled arithmetic operations. Noise can alter interference and destroy the intended distribution. Useful tests include:

- Ideal versus noisy position histograms.
- Success probability versus step count.
- Effect of coin-gate errors.
- Effect of shift-arithmetic errors.
- Readout-error mitigation.

---

# 17. Complexity and quantum speedups

## 17.1 Classical versus quantum spreading

On a line, a classical random walk spreads over a characteristic distance

\[
O(\sqrt t),
\]

while a coherent quantum walk can spread over

\[
O(t)
\]

in suitable settings.

## 17.2 Search complexity

Quantum-walk search complexity depends on graph structure. For some graphs, quantum walks provide quadratic or other polynomial improvements over classical random walks.

## 17.3 Spectral dependence

Performance may depend on:

- Spectral gap.
- Graph degree.
- Conductance.
- Hitting time.
- Marked-set size.
- Walk mixing behavior.

## 17.4 Oracle and walk cost

The abstract walk-step count is not the complete runtime. A practical implementation must include:

- Coin-gate cost.
- Shift-arithmetic cost.
- Marking-oracle cost.
- Number of measurements.
- Classical post-processing.
- Error correction or mitigation.

## 17.5 No universal speedup

Quantum walks do not automatically outperform classical walks on every graph. The graph, initial state, observable, and algorithmic objective determine whether a quantum advantage exists.

---

# 18. Common misconceptions

## Misconception 1: A quantum walk is just a random walk with complex probabilities

Quantum walks use complex amplitudes that interfere. Probabilities are obtained only after taking squared magnitudes.

## Misconception 2: The coin represents classical randomness

The coin is a quantum register. A coin operation creates a coherent superposition of directions.

## Misconception 3: Quantum walks always spread faster

Ballistic spreading occurs in important models, but boundaries, coins, graph structure, interference, and initial states affect the distribution.

## Misconception 4: Continuous-time and discrete-time walks are identical

They are related but use different mathematical models and can have different spectral and algorithmic behavior.

## Misconception 5: Measuring after every step preserves quantum advantage

Frequent measurement can destroy coherence and turn the process into a more classical random walk.

## Misconception 6: A marked vertex absorbs the walker automatically

A marking oracle usually changes a phase. Absorption requires an explicit measurement or modified evolution.

## Misconception 7: The graph adjacency matrix is always the Hamiltonian

The adjacency matrix is one choice. The graph Laplacian and other Hamiltonians are also used.

## Misconception 8: Quantum-walk speedup ignores graph representation

Encoding vertices, edges, shifts, and marked conditions can dominate the implementation cost.

---

# 19. Chapter summary

A quantum walk is a unitary evolution over a graph. Unlike a classical random walk, it combines amplitudes before probabilities are calculated, allowing constructive and destructive interference.

A discrete-time coined walk uses a coin and position register:

\[
W=S(C\otimes I).
\]

A continuous-time walk evolves under a graph Hamiltonian:

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

Quantum walks can spread ballistically, with characteristic distance \(O(t)\), compared with the classical diffusive scale \(O(\sqrt t)\) on a line.

Search algorithms mark vertices with a phase operation and use repeated walk steps to amplify marked-state probability. Their performance depends on graph structure and spectral properties.

Szegedy quantum walks provide a general method for quantizing classical Markov chains. The eigenvalues and eigenphases of walk operators can be studied with quantum phase estimation, connecting quantum walks to the module’s earlier topics.

Quantum-walk algorithms are hybrid procedures. They require graph encoding, walk evolution, marking, measurement, and classical interpretation. Their practical cost depends on shift arithmetic, graph connectivity, oracle construction, circuit depth, and noise.

---

# 20. Formula sheet

Graph:

\[
G=(V,E).
\]

Adjacency matrix:

\[
A_{xy}=1\text{ if }(x,y)\in E.
\]

Classical transition matrix:

\[
P=D^{-1}A.
\]

Discrete-time walk:

\[
W=S(C\otimes I).
\]

Hadamard coin:

\[
H=\frac1{\sqrt2}
\begin{bmatrix}1&1\\1&-1\end{bmatrix}.
\]

Conditional shift:

\[
S|0,x\rangle=|0,x-1\rangle,
\]

\[
S|1,x\rangle=|1,x+1\rangle.
\]

Continuous-time walk:

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

Graph Laplacian:

\[
L=D-A.
\]

Marking oracle:

\[
O_M|x\rangle=(-1)^{[x\in M]}|x\rangle.
\]

Binary position shift on a cycle:

\[
x\mapsto x\pm1\pmod L.
\]

Classical spreading scale:

\[
O(\sqrt t).
\]

Quantum spreading scale in suitable line walks:

\[
O(t).
\]

---

# 21. Review questions and exercises

## Conceptual questions

1. What is a quantum walk?
2. How does a quantum walk differ from a classical random walk?
3. What is the role of a coin register?
4. Define the coin operator and shift operator.
5. What is the discrete-time walk operator?
6. What is a continuous-time quantum walk?
7. How does interference affect a walk distribution?
8. What is a marked vertex?
9. What is a hitting time?
10. Why do quantum walks not always converge to a stationary distribution?
11. What is a Szegedy quantum walk?
12. How can QPE analyze a quantum walk?
13. What graph properties influence search performance?
14. Why is graph encoding important in practice?

## Numerical exercises

1. Write the adjacency matrix of a two-vertex graph.
2. Write the adjacency matrix of a three-vertex line.
3. Calculate one coined-walk step from the origin.
4. Calculate the two-step position probabilities for the Hadamard walk.
5. Calculate the Hamiltonian evolution for the two-vertex graph with \(H=X\).
6. Calculate the graph Laplacian for a two-vertex graph.
7. Calculate the position shift on a cycle of size 4.
8. Compare classical and quantum spreading after 100 steps.
9. Calculate the phase relation for a Hamiltonian eigenvalue \(\lambda\) evolved for time \(t\).
10. Identify the marked-state phase change for a specified marked set.

## Circuit exercises

Draw and analyze:

1. A one-step coined walk on a line.
2. A two-step coined walk.
3. A coined walk on a four-vertex cycle.
4. A conditional modular-increment shift.
5. A conditional modular-decrement shift.
6. A marked-vertex search walk.
7. A walk operator followed by QPE.

For each circuit:

- Identify the coin and position registers.
- Apply the coin transformation.
- Apply the conditional shift.
- Track relative phases.
- Calculate measurement probabilities.

## Programming activity

Using Qiskit, Cirq, PennyLane, or a classical quantum simulation package:

1. Simulate a one-dimensional coined quantum walk.
2. Plot the position distribution after different step counts.
3. Compare the result with a classical random walk.
4. Implement a cycle graph.
5. Add a marked vertex and a phase oracle.
6. Measure marked-state probability versus time.
7. Simulate a continuous-time walk using matrix exponentiation.
8. Estimate a walk eigenphase with QPE.
9. Add noise and study interference loss.
10. Compare different coin operators and initial states.

---

# 22. Glossary

**Adjacency matrix:** A matrix describing which graph vertices are connected.

**Coin operator:** A unitary operation that creates a superposition of walk directions.

**Continuous-time quantum walk:** A walk generated by Hamiltonian evolution \(e^{-iHt}\).

**Discrete-time quantum walk:** A walk generated by repeated applications of a coin-and-shift unitary.

**Hitting time:** The time required to reach a marked or target set.

**Marked vertex:** A graph vertex satisfying a search condition.

**Quantum walk:** A coherent quantum evolution over graph positions or edges.

**Szegedy walk:** A quantum walk constructed from a classical Markov chain using reflections.

**Shift operator:** A conditional operation that moves the walker according to the coin state.

**Spectral gap:** A difference between relevant leading eigenvalues that influences graph dynamics.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/PhysRevA.58.915 "Quantum random walks"

[4]: https://doi.org/10.1103/PhysRevA.69.052319 "Quantum walks and element distinctness"

[5]: https://doi.org/10.1103/PhysRevA.69.020303 "Quantum search algorithms on graphs"

[6]: https://doi.org/10.1103/PhysRevA.60.195 "Quantum walks on graphs"

[7]: https://theory.caltech.edu/~preskill/ph229/ "John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation"

## Key formulas: derivation and interpretation

### Discrete-time walk operator

A discrete quantum walk commonly has the form:

\[
U=S(C\otimes I).
\]

Here C is a coin operator, I is the identity on position, and S conditionally shifts the walker. **Derivation:** First apply the coin to create a superposition of directions; then apply the shift conditioned on the coin state. Both components are unitary, so their product U is unitary.

### Continuous-time walk

\[
|\psi(t)\rangle=e^{-iHt}|\psi(0)\rangle.
\]

The Hamiltonian H generates continuous evolution. This follows from the Schrödinger equation \(i\,d|\psi(t)\rangle/dt=H|\psi(t)\rangle\). The matrix exponential preserves norm when H is Hermitian.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is a classical random walk?
   **Answer:** A probabilistic movement through graph vertices or positions.

2. **Question:** What is a quantum walk?
   **Answer:** A quantum evolution over positions, often with a coin or Hamiltonian.

3. **Question:** Name two models.
   **Answer:** Discrete-time and continuous-time quantum walks.

4. **Question:** What can quantum walks support?
   **Answer:** Search, graph algorithms, transport models, and quantum algorithm design.

5. **Question:** What causes different spreading behavior?
   **Answer:** Coherent amplitude evolution and interference.

### Chapter quiz

1. What is a classical random walk?

2. What is a quantum walk?

3. Name two models.

4. What can quantum walks support?

5. What causes different spreading behavior?

### Quiz answer key

1. **A probabilistic movement through graph vertices or positions.**

2. **A quantum evolution over positions, often with a coin or Hamiltonian.**

3. **Discrete-time and continuous-time quantum walks.**

4. **Search, graph algorithms, transport models, and quantum algorithm design.**

5. **Coherent amplitude evolution and interference.**


---


# Chapter 11: Variational Quantum Algorithms {#chapter-11-variational-quantum-algorithms}

## 4.1 Chapter overview

**Variational Quantum Algorithms (VQAs)** are hybrid quantum-classical algorithms in which a parameterized quantum circuit prepares trial states and a classical optimizer updates the circuit parameters to minimize or maximize an objective function.

A general VQA alternates between:

1. Preparing a parameterized state \(|\psi(\boldsymbol\theta)\rangle\) on a quantum processor.
2. Measuring observables to estimate a cost function.
3. Sending the estimated cost to a classical optimizer.
4. Updating parameters \(\boldsymbol\theta\).
5. Repeating until convergence or a stopping condition is reached.

The central optimization problem is

\[
\boldsymbol\theta^*
=\arg\min_{\boldsymbol\theta}C(\boldsymbol\theta),
\]

where

\[
C(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle
\]

for a Hamiltonian \(H\), or another application-specific objective.

The most important examples are:

- **Variational Quantum Eigensolver (VQE)** for estimating ground-state energies.
- **Quantum Approximate Optimization Algorithm (QAOA)** for discrete optimization.
- Variational quantum classifiers.
- Quantum neural-network models.
- Variational quantum simulation.
- Variational compiling and error mitigation.

VQAs are attractive for noisy intermediate-scale quantum devices because they can use relatively shallow circuits and classical feedback. However, they introduce challenges involving optimization landscapes, measurement cost, noise, parameter initialization, ansatz expressibility, and trainability.

---

## 4.2 Learning objectives

After studying this chapter, learners should be able to:

1. Define a variational quantum algorithm.
2. Explain the role of the ansatz, cost function, optimizer, and measurement loop.
3. Derive the variational principle for ground-state estimation.
4. Decompose Hamiltonians into measurable Pauli terms.
5. Explain the VQE workflow.
6. Describe QAOA and its alternating operators.
7. Compare hardware-efficient and problem-inspired ansätze.
8. Explain parameter-shift gradients.
9. Analyze shot noise and optimization error.
10. Identify barren plateaus and expressibility issues.
11. Design a small VQE or QAOA experiment.
12. Compare optimizers and stopping criteria.
13. Evaluate VQA performance using energy, approximation ratio, and resource metrics.

---

# 5. Variational optimization on a quantum computer

## 5.1 Parameterized quantum state

A parameterized circuit is written

\[
U(\boldsymbol\theta),
\]

where

\[
\boldsymbol\theta=(\theta_1,\theta_2,\ldots,\theta_p).
\]

Starting from a reference state \(|\psi_0\rangle\), the ansatz prepares

\[
|\psi(\boldsymbol\theta)\rangle
=U(\boldsymbol\theta)|\psi_0\rangle.
\]

## 5.2 Cost function

The cost function maps parameters to a real number:

\[
C:\mathbb R^p\rightarrow\mathbb R.
\]

The optimizer searches for a parameter vector that minimizes or maximizes this value.

## 5.3 Hybrid loop

The hybrid loop is

\[
\boldsymbol\theta^{(t)}
\rightarrow
\text{quantum measurement}
\rightarrow
C(\boldsymbol\theta^{(t)})
\rightarrow
\text{classical update}
\rightarrow
\boldsymbol\theta^{(t+1)}.
\]

The quantum processor evaluates objective values or gradients; the classical processor performs numerical optimization.

## 5.4 Stopping conditions

An optimization may stop when:

\[
|C_{t+1}-C_t|<\varepsilon,
\]

or when

\[
\|\boldsymbol\theta^{(t+1)}-\boldsymbol\theta^{(t)}\|<\varepsilon,
\]

or when a maximum number of iterations is reached.

---

# 6. The variational principle

## 6.1 Ground-state energy

Let \(H\) be a Hermitian Hamiltonian with eigenstates \(|E_j\rangle\) and eigenvalues \(E_j\):

\[
H|E_j\rangle=E_j|E_j\rangle.
\]

Assume

\[
E_0\le E_1\le E_2\le\cdots.
\]

For any normalized trial state

\[
|\psi\rangle=\sum_jc_j|E_j\rangle,
\]

we have

\[
\langle H\rangle
=\langle\psi|H|\psi\rangle
=\sum_j|c_j|^2E_j.
\]

Since every \(E_j\ge E_0\),

\[
\langle\psi|H|\psi\rangle\ge E_0.
\]

## 6.2 Variational upper bound

The minimum energy over all normalized states is the ground-state energy:

\[
E_0=\min_{|\psi\rangle}\langle\psi|H|\psi\rangle.
\]

For a restricted ansatz,

\[
E_0\le \min_{\boldsymbol\theta}
\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle.
\]

The VQE estimate is therefore an upper bound in the ideal noiseless setting.

## 6.3 Ansatz limitation

If the ansatz cannot represent the true ground state, the optimized value is above \(E_0\). Increasing expressibility may improve accuracy but can increase circuit depth and optimization difficulty.

---

# 7. Hamiltonian measurement

## 7.1 Pauli decomposition

An \(n\)-qubit Hamiltonian can be decomposed as

\[
H=\sum_{j=1}^{L}c_jP_j,
\]

where each \(P_j\) is a tensor product of Pauli operators:

\[
P_j\in\{I,X,Y,Z\}^{\otimes n}.
\]

The expectation value is

\[
\langle H\rangle
=\sum_{j=1}^{L}c_j\langle P_j\rangle.
\]

## 7.2 Measuring Pauli strings

For a computational-basis measurement, \(Z\)-type strings can be measured directly. To measure \(X\) or \(Y\):

- Apply H before measurement for an X measurement.
- Apply \(S^\dagger\) followed by H for a Y measurement.
- Measure in the computational basis.

## 7.3 Example

Let

\[
H=0.5Z_0+0.3Z_1-0.2X_0X_1.
\]

Then

\[
E(\boldsymbol\theta)
=0.5\langle Z_0\rangle
+0.3\langle Z_1\rangle
-0.2\langle X_0X_1\rangle.
\]

Each expectation value is estimated from repeated circuit shots.

## 7.4 Shot estimator

If a Pauli measurement returns eigenvalues \(+1\) and \(-1\), the estimator is

\[
\widehat{\langle P\rangle}
=\frac{N_+-N_-}{N_{\text{shots}}}.
\]

The estimated energy is

\[
\widehat E=\sum_jc_j\widehat{\langle P_j\rangle}.
\]

## 7.5 Measurement variance

For a Pauli observable with eigenvalues \(\pm1\),

\[
\operatorname{Var}(P)=1-\langle P\rangle^2.
\]

The standard error of the sample mean approximately scales as

\[
\sigma_{\widehat P}
=\sqrt{\frac{1-\langle P\rangle^2}{N_{\text{shots}}}}.
\]

More shots reduce statistical error but increase runtime.

---

# 8. Variational Quantum Eigensolver (VQE)

## 8.1 VQE objective

VQE minimizes

\[
E(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle.
\]

The optimized value estimates the ground-state energy.

## 8.2 VQE workflow

1. Choose a Hamiltonian \(H\).
2. Choose a reference state \(|\psi_0\rangle\).
3. Choose an ansatz \(U(\boldsymbol\theta)\).
4. Initialize parameters.
5. Prepare \(|\psi(\boldsymbol\theta)\rangle\).
6. Measure each Pauli term.
7. Estimate the energy.
8. Update parameters classically.
9. Repeat until convergence.
10. Verify energy and state quality.

## 8.3 VQE pseudocode

```text
function VQE(H, ansatz, initial_parameters):
    theta = initial_parameters

    repeat until stopping condition:
        state = ansatz(theta)
        energy = measure_expectation(H, state)
        gradient = estimate_gradient_if_needed(H, ansatz, theta)
        theta = classical_optimizer_update(theta, energy, gradient)

    return theta, energy
```

## 8.4 Reference states

A reference state may be:

- \(|0\rangle^{\otimes n}\).
- A Hartree-Fock state in quantum chemistry.
- A computational solution suggested by classical preprocessing.
- A state prepared by a previous optimization.

Good initial overlap with the target state often improves convergence.

## 8.5 Excited states

VQE can be extended to excited states using:

- Orthogonality penalties.
- Deflation.
- Subspace expansion.
- Quantum equation-of-motion methods.

A penalty objective may be

\[
C_k(\boldsymbol\theta)
=\langle H\rangle
+\sum_{j<k}\beta_j|
\langle\psi(\boldsymbol\theta)|\psi_j\rangle|^2.
\]

---

# 9. Ansatz design

## 9.1 Hardware-efficient ansatz

A hardware-efficient ansatz uses gates naturally supported by a device:

```text
q0: ──Ry(θ)──Rz(θ)──●────────Ry(θ)──
q1: ──Ry(θ)──Rz(θ)──X──●─────Ry(θ)──
q2: ──Ry(θ)──Rz(θ)─────X─────Ry(θ)──
```

Advantages:

- Shorter compiled circuits.
- Direct compatibility with device connectivity.
- Simple parameterization.

Disadvantages:

- Possible barren plateaus.
- Limited physical interpretability.
- Poor symmetry preservation.

## 9.2 Problem-inspired ansatz

A problem-inspired ansatz incorporates known structure. Examples include:

- Unitary coupled-cluster ansätze.
- Hamiltonian variational ansätze.
- Symmetry-preserving circuits.
- Problem-specific excitation operators.

These may use fewer parameters but require more domain knowledge.

## 9.3 Layered ansatz

A layered ansatz can be written

\[
U(\boldsymbol\theta)
=U_L(\boldsymbol\theta_L)\cdots U_2(\boldsymbol\theta_2)U_1(\boldsymbol\theta_1).
\]

Depth controls expressibility and hardware cost.

## 9.4 Expressibility

An ansatz is expressive if it can represent a broad family of states. Excessive expressibility is not always desirable because highly expressive random circuits may have difficult optimization landscapes.

## 9.5 Symmetry constraints

If the Hamiltonian conserves a quantity such as particle number or parity, the ansatz can be designed to remain in the relevant symmetry sector. This can reduce search space and improve accuracy.

---

# 10. Gradients and optimizers

## 10.1 Gradient-based optimization

A gradient-based optimizer uses

\[
\boldsymbol\theta_{t+1}
=\boldsymbol\theta_t-\eta\nabla C(\boldsymbol\theta_t),
\]

where \(\eta\) is a learning rate.

## 10.2 Parameter-shift rule

For a parameterized gate generated by a Pauli operator, the derivative can often be evaluated by

\[
\frac{\partial C}{\partial\theta_j}
=\frac12\left[
C\left(\theta_j+\frac\pi2\right)
-C\left(\theta_j-\frac\pi2\right)
\right].
\]

This requires two shifted circuit evaluations per parameter in the simplest case.

## 10.3 Finite differences

A finite-difference approximation is

\[
\frac{\partial C}{\partial\theta_j}
\approx
\frac{C(\theta_j+\delta)-C(\theta_j-\delta)}{2\delta}.
\]

It is easy to implement but sensitive to shot noise and the choice of \(\delta\).

## 10.4 Gradient-free optimizers

Common gradient-free methods include:

- Nelder–Mead.
- Powell optimization.
- COBYLA.
- SPSA.
- CMA-ES.

SPSA uses noisy gradient estimates with only a small number of objective evaluations per iteration, making it attractive for hardware experiments.

## 10.5 Optimizer comparison

| Optimizer type | Strength | Limitation |
|---|---|---|
| Gradient descent | Simple and interpretable | Requires reliable gradients |
| Adam | Adaptive learning rates | Can be unstable with noisy costs |
| SPSA | Few evaluations | High-variance gradient estimates |
| COBYLA | Derivative-free | Can converge slowly |
| Nelder–Mead | Simple small problems | Poor scaling with parameters |

---

# 11. QAOA

## 11.1 Optimization problem

QAOA solves a classical optimization problem encoded by a cost Hamiltonian \(H_C\). It uses a mixer Hamiltonian \(H_M\).

The depth-\(p\) QAOA state is

\[
|\boldsymbol\gamma,\boldsymbol\beta\rangle
=\prod_{j=1}^{p}
 e^{-i\beta_jH_M}e^{-i\gamma_jH_C}|+\rangle^{\otimes n}.
\]

## 11.2 Objective

The objective is often

\[
C(\boldsymbol\gamma,\boldsymbol\beta)
=\langle\boldsymbol\gamma,\boldsymbol\beta|
H_C
|\boldsymbol\gamma,\boldsymbol\beta\rangle.
\]

The classical optimizer adjusts \(\gamma_j\) and \(\beta_j\).

## 11.3 Mixer Hamiltonian

The standard mixer is

\[
H_M=\sum_{i=1}^{n}X_i.
\]

The corresponding unitary is

\[
e^{-i\beta H_M}
=\prod_i e^{-i\beta X_i}.
\]

## 11.4 MaxCut encoding

For a graph \(G=(V,E)\), assign a bit \(z_i\in\{0,1\}\) to each vertex. An edge contributes to the cut when endpoints have different bits.

The cost for edge \((i,j)\) can be represented by

\[
C_{ij}=\frac12(1-Z_iZ_j).
\]

The MaxCut Hamiltonian is

\[
H_C=\sum_{(i,j)\in E}\frac12(1-Z_iZ_j).
\]

Maximizing the expected cut value is equivalent to maximizing \(\langle H_C\rangle\).

## 11.5 Approximation ratio

If the optimal classical cost is \(C_{\max}\), a measured solution with expected cost \(\langle C\rangle\) has approximation ratio

\[
\rho=\frac{\langle C\rangle}{C_{\max}}.
\]

## 11.6 QAOA depth

Increasing \(p\) increases expressibility but also increases circuit depth, parameter count, optimization difficulty, and noise sensitivity.

---

# 12. Barren plateaus and trainability

## 12.1 Barren plateau

A **barren plateau** is an optimization landscape region where the variance of the gradient becomes very small as system size grows:

\[
\operatorname{Var}\left[
\frac{\partial C}{\partial\theta_j}
\right]
\rightarrow0.
\]

Gradients then become difficult to distinguish from measurement noise.

## 12.2 Causes

Possible causes include:

- Deep random ansätze.
- Excessive entanglement.
- Global cost functions.
- Poor initialization.
- Noise-induced concentration.

## 12.3 Mitigation strategies

Strategies include:

- Shallow circuits.
- Local cost functions.
- Layer-by-layer training.
- Problem-inspired ansätze.
- Symmetry-preserving initialization.
- Parameter correlations.
- Adaptive ansatz growth.
- Better observable grouping.

## 12.4 Expressibility versus trainability

An ansatz that represents every state may be difficult to optimize. Practical design balances:

\[
\text{expressibility},
\quad
\text{trainability},
\quad
\text{hardware cost}.
\]

---

# 13. Noise and measurement uncertainty

## 13.1 Noisy objective

On hardware, the measured objective is approximately

\[
\widehat C(\boldsymbol\theta)
=C(\boldsymbol\theta)+\epsilon_{\text{shot}}+\epsilon_{\text{device}}.
\]

Here:

- \(\epsilon_{\text{shot}}\) is statistical sampling noise.
- \(\epsilon_{\text{device}}\) is hardware noise and systematic error.

## 13.2 Optimization under noise

A noisy optimizer may:

- Stop too early.
- Follow false improvements.
- Overshoot minima.
- Interpret random fluctuations as gradients.

Use repeated evaluations and confidence intervals when comparing nearby parameters.

## 13.3 Error mitigation

Methods include:

- Readout-error mitigation.
- Zero-noise extrapolation.
- Symmetry verification.
- Probabilistic error cancellation.
- Measurement-error calibration.

## 13.4 Bias versus variance

Increasing shots reduces variance but does not remove systematic bias. Error mitigation may reduce bias but introduce additional sampling variance.

---

# 14. Practical VQA workflow

## 14.1 Design checklist

1. Define the physical or combinatorial objective.
2. Encode it as a Hamiltonian or measurable observable.
3. Select a reference state.
4. Design an ansatz.
5. Choose an optimizer.
6. Initialize parameters.
7. Estimate objective values.
8. Monitor convergence.
9. Validate against classical results when possible.
10. Report circuit and measurement resources.

## 14.2 Baselines

Compare against:

- A classical exact solution for small instances.
- A classical heuristic.
- A random parameter baseline.
- A shallow-circuit baseline.
- An ideal state-vector simulation.

## 14.3 Reproducibility

Record:

- Hamiltonian coefficients.
- Ansatz architecture.
- Initial parameters.
- Optimizer and hyperparameters.
- Number of shots.
- Random seeds.
- Backend and noise model.
- Stopping criteria.

## 14.4 Reporting results

Report more than the final cost. Include:

- Best cost.
- Mean and standard deviation across runs.
- Number of circuit evaluations.
- Number of shots.
- Circuit depth and two-qubit count.
- Parameter count.
- Ideal and noisy results.

---

# 15. Worked examples

## 15.1 One-qubit VQE

Let

\[
H=Z.
\]

The ground state is \(|1\rangle\) with energy \(-1\). Use the ansatz

\[
|\psi(\theta)\rangle=R_y(\theta)|0\rangle.
\]

Since

\[
R_y(\theta)|0\rangle
=\cos\frac\theta2|0\rangle
+\sin\frac\theta2|1\rangle,
\]

we obtain

\[
E(\theta)=\langle Z\rangle
=\cos^2\frac\theta2-
\sin^2\frac\theta2
=\cos\theta.
\]

The minimum is

\[
E(\pi)=-1.
\]

## 15.2 Two-qubit Hamiltonian

Let

\[
H=Z_0+Z_1+0.5X_0X_1.
\]

Measure the three Pauli terms independently:

\[
E=\langle Z_0\rangle+
\langle Z_1\rangle+
0.5\langle X_0X_1\rangle.
\]

The optimizer varies ansatz parameters to reduce \(E\).

## 15.3 MaxCut edge

For a single edge between qubits 0 and 1,

\[
H_C=\frac12(I-Z_0Z_1).
\]

The states \(|01\rangle\) and \(|10\rangle\) have cost 1, while \(|00\rangle\) and \(|11\rangle\) have cost 0.

## 15.4 One-layer QAOA

For \(p=1\),

\[
|\gamma,\beta\rangle
=e^{-i\beta H_M}e^{-i\gamma H_C}|+\rangle^{\otimes n}.
\]

The two parameters \(\gamma\) and \(\beta\) are optimized classically.

---

# 16. Chapter summary

Variational Quantum Algorithms use a parameterized quantum circuit and a classical optimizer to solve an optimization problem.

The general objective is

\[
\boldsymbol\theta^*
=\arg\min_{\boldsymbol\theta}C(\boldsymbol\theta).
\]

For VQE,

\[
C(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle,
\]

and the variational principle guarantees an upper bound on the ground-state energy in the ideal setting.

Hamiltonians are decomposed into Pauli strings:

\[
H=\sum_jc_jP_j.
\]

VQE estimates each Pauli expectation value and combines the results. QAOA alternates cost and mixer unitaries:

\[
|\boldsymbol\gamma,\boldsymbol\beta\rangle
=\prod_{j=1}^{p}
 e^{-i\beta_jH_M}e^{-i\gamma_jH_C}|+\rangle^{\otimes n}.
\]

VQAs can operate with shallow circuits, but practical performance depends on ansatz design, optimizer selection, measurement variance, hardware noise, parameter initialization, and trainability. Barren plateaus and excessive circuit depth can prevent useful optimization.

---

# 17. Formula sheet

Parameterized state:

\[
|\psi(\boldsymbol\theta)\rangle
=U(\boldsymbol\theta)|\psi_0\rangle.
\]

VQA objective:

\[
\boldsymbol\theta^*=\arg\min_{\boldsymbol\theta}C(\boldsymbol\theta).
\]

VQE energy:

\[
E(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle.
\]

Hamiltonian decomposition:

\[
H=\sum_jc_jP_j.
\]

Shot estimator:

\[
\widehat{\langle P\rangle}
=\frac{N_+-N_-}{N_{\text{shots}}}.
\]

Parameter-shift rule:

\[
\frac{\partial C}{\partial\theta_j}
=\frac12\left[C(\theta_j+\frac\pi2)-C(\theta_j-\frac\pi2)\right].
\]

QAOA state:

\[
|\boldsymbol\gamma,\boldsymbol\beta\rangle
=\prod_{j=1}^{p}
 e^{-i\beta_jH_M}e^{-i\gamma_jH_C}|+\rangle^{\otimes n}.
\]

MaxCut edge Hamiltonian:

\[
C_{ij}=\frac12(1-Z_iZ_j).
\]

Approximation ratio:

\[
\rho=\frac{\langle C\rangle}{C_{\max}}.
\]

---

# 18. Review questions and exercises

## Conceptual questions

1. What is a variational quantum algorithm?
2. What is an ansatz?
3. What is the role of a classical optimizer?
4. State the variational principle.
5. Why is a VQE energy an upper bound in the ideal setting?
6. How are Hamiltonians measured on a quantum computer?
7. What is the parameter-shift rule?
8. What is QAOA?
9. What is a mixer Hamiltonian?
10. What is a barren plateau?
11. How do hardware-efficient and problem-inspired ansätze differ?
12. How does shot noise affect optimization?

## Numerical exercises

1. Derive the VQE energy for \(H=Z\) and \(|\psi(\theta)\rangle=R_y(\theta)|0\rangle\).
2. Find the minimum of \(E(\theta)=\cos\theta\).
3. Decompose a two-qubit Hamiltonian into Pauli expectations.
4. Calculate a Pauli expectation from measurement counts.
5. Estimate the shot standard error for a Pauli observable.
6. Write the MaxCut Hamiltonian for a triangle graph.
7. Calculate the approximation ratio of a measured cut.
8. Apply one parameter-shift update.

## Programming activity

1. Implement one-qubit VQE for \(H=Z\).
2. Implement a two-qubit Hamiltonian measurement routine.
3. Compare SPSA and COBYLA.
4. Plot the optimization landscape.
5. Implement a one-layer QAOA circuit for MaxCut.
6. Add finite-shot sampling.
7. Simulate measurement noise.
8. Compare hardware-efficient and problem-inspired ansätze.
9. Measure gradient variance as circuit depth increases.
10. Report circuit depth, shots, evaluations, and final cost.

---

# 19. Glossary

**Ansatz:** A parameterized family of quantum states.

**Barren plateau:** A region where gradients become extremely small.

**Cost function:** A scalar objective optimized by the classical controller.

**Mixer Hamiltonian:** The QAOA Hamiltonian that moves amplitude among computational states.

**Parameter-shift rule:** A method for calculating quantum-circuit derivatives using shifted parameters.

**QAOA:** A variational algorithm for combinatorial optimization.

**VQE:** A variational algorithm for estimating ground-state energies.

**Variational principle:** The expectation value of a Hamiltonian over any normalized state is at least the ground-state energy.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/variational-algorithm-design "IBM Quantum Learning: Variational Algorithm Design"

[2]: https://qiskit-community.github.io/qiskit-algorithms/tutorials/02_vqe_advanced_options.html "Qiskit Algorithms: VQE"

[3]: https://doi.org/10.1103/PhysRevA.98.022308 "A brief overview of VQE"

[4]: https://doi.org/10.1038/nature23879 "A variational eigenvalue solver on a photonic quantum processor"

[5]: https://doi.org/10.48550/arXiv.1411.4028 "A quantum approximate optimization algorithm"

[6]: https://doi.org/10.1103/PhysRevA.98.032309 "Evaluating analytic gradients on quantum hardware"

## Key formulas: derivation and interpretation

### Variational principle

For a Hamiltonian H and normalized trial state \(|\psi(\theta)\rangle\):

\[
E(\theta)=\langle\psi(\theta)|H|\psi(\theta)\rangle\ge E_0,
\]

where \(E_0\) is the ground-state energy.

**Derivation:** Expand the trial state in energy eigenstates \(|E_j\rangle\): \(|\psi\rangle=\sum_jc_j|E_j\rangle\). Then:

\[
E(\theta)=\sum_j|c_j|^2E_j.
\]

Because every \(E_j\ge E_0\) and \(\sum_j|c_j|^2=1\), the weighted average cannot be below \(E_0\). A classical optimizer changes \(\theta\) to minimize this expectation.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is a variational quantum algorithm?
   **Answer:** A hybrid algorithm using a parameterized quantum circuit and a classical optimizer.

2. **Question:** What is a cost function?
   **Answer:** A scalar objective estimated from circuit measurements.

3. **Question:** What is VQE used for?
   **Answer:** Estimating low-energy states of quantum systems.

4. **Question:** What is QAOA used for?
   **Answer:** Approximate combinatorial optimization.

5. **Question:** What is the variational principle?
   **Answer:** The energy expectation of a trial state is at least the ground-state energy.

### Chapter quiz

1. What is a variational quantum algorithm?

2. What is a cost function?

3. What is VQE used for?

4. What is QAOA used for?

5. What is the variational principle?

### Quiz answer key

1. **A hybrid algorithm using a parameterized quantum circuit and a classical optimizer.**

2. **A scalar objective estimated from circuit measurements.**

3. **Estimating low-energy states of quantum systems.**

4. **Approximate combinatorial optimization.**

5. **The energy expectation of a trial state is at least the ground-state energy.**


---


# Chapter 12: Quantum Algorithm Implementation & Analysis {#chapter-12-quantum-algorithm-implementation-analysis}

## 5.1 Chapter overview

Designing a quantum algorithm mathematically is only the beginning. A complete implementation must translate the algorithm into gates, map those gates to a simulator or hardware device, execute repeated measurements, analyze uncertainty, and compare the result with an appropriate baseline.

**Quantum algorithm implementation and analysis** covers the complete path from an abstract unitary to a validated computational result:

\[
\text{problem}
\rightarrow
\text{mathematical formulation}
\rightarrow
\text{circuit}
\rightarrow
\text{compiled circuit}
\rightarrow
\text{execution}
\rightarrow
\text{measurement data}
\rightarrow
\text{analysis}.
\]

Implementation is not merely writing code. It requires decisions about:

- State and register representation.
- Gate decomposition.
- Qubit ordering.
- Classical-bit mapping.
- Circuit depth and width.
- Connectivity and routing.
- Simulation method.
- Measurement strategy.
- Statistical uncertainty.
- Noise and error mitigation.
- Resource estimation.
- Verification and reproducibility.

A useful analysis distinguishes four levels:

1. **Algorithmic correctness:** Does the mathematical algorithm solve the intended problem?
2. **Circuit correctness:** Does the implemented circuit represent the intended unitary?
3. **Execution correctness:** Does the simulator or hardware run the circuit as specified?
4. **Scientific validity:** Do the measured results support the claimed conclusion?

A quantum circuit can be mathematically correct but incorrectly implemented because of reversed qubit order, missing swaps, incorrect controlled gates, or an inconsistent measurement map. Conversely, a circuit can execute without errors while solving the wrong problem.

---

## 5.2 Learning objectives

After studying this chapter, learners should be able to:

1. Translate a quantum algorithm into registers and gates.
2. Distinguish state-vector, shot-based, stabilizer, tensor-network, and noisy simulation.
3. Explain circuit width, depth, gate count, and two-qubit count.
4. Describe transpilation and hardware mapping.
5. Analyze qubit connectivity and routing overhead.
6. Design measurement and sampling experiments.
7. Estimate expectation values and confidence intervals.
8. Verify circuits using basis-state and unitary tests.
9. Compare ideal, noisy, and hardware results.
10. Identify common implementation bugs.
11. Evaluate quantum resources and scaling.
12. Build reproducible benchmarking experiments.
13. Analyze algorithms including QPE, Shor, quantum walks, and VQAs.

---

# 6. From algorithm to circuit

## 6.1 Problem specification

Begin with a precise statement of:

- Input format.
- Output format.
- Promise conditions, if any.
- Success criterion.
- Error tolerance.
- Classical preprocessing.
- Classical post-processing.

For a phase-estimation problem, specify

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle
\]

and the desired precision \(\epsilon\).

## 6.2 Register design

Determine the registers required. For example, QPE uses:

- A counting register of \(t\) qubits.
- A target register containing \(|\psi\rangle\).
- Optional ancillas for controlled arithmetic.

The number of basis states represented by an \(n\)-qubit register is

\[
2^n.
\]

## 6.3 State preparation

Specify the initial state:

\[
|\Psi_0\rangle
=|\text{counting}\rangle
\otimes|\text{target}\rangle.
\]

State preparation may be simple, such as \(|0\rangle^{\otimes n}\), or may require a separate algorithm.

## 6.4 Unitary decomposition

Write the abstract unitary as a sequence:

\[
U=U_mU_{m-1}\cdots U_2U_1.
\]

Each \(U_j\) must be decomposed into gates supported by the chosen software framework or hardware device.

## 6.5 Measurement design

Specify:

- Which qubits are measured.
- Measurement basis.
- Number of shots.
- Classical-bit mapping.
- Post-processing rule.

A correct quantum state with an incorrect measurement map produces incorrect output data.

---

# 7. Quantum circuit representation

## 7.1 Circuit model

A circuit is an ordered sequence of quantum operations acting on registers. A circuit can be represented as a directed acyclic graph whose wires are qubits and whose nodes are gates.

## 7.2 Gate sets

Common abstract gates include:

\[
X,Y,Z,H,S,T,
\]

rotation gates \(R_x,R_y,R_z\), controlled gates, and multi-qubit unitaries.

A hardware may support only a native gate set such as:

- Single-qubit rotations.
- Controlled-X or echoed cross-resonance gates.
- iSWAP-like gates.
- Controlled-phase gates.

## 7.3 Gate ordering

Quantum gates generally do not commute. If

\[
U=U_2U_1,
\]

then \(U_1\) acts first and \(U_2\) acts second.

Confusing left-to-right diagram order with matrix multiplication order is a common implementation error.

## 7.4 Controlled operations

A controlled-U gate has block form

\[
\operatorname{CU}
=|0\rangle\langle0|\otimes I
+|1\rangle\langle1|\otimes U.
\]

The control and target order must be explicit.

## 7.5 Ancillas

Ancilla qubits support:

- Reversible arithmetic.
- Oracle construction.
- Error correction.
- Workspace for decomposition.
- Uncomputation.

Ancillas should be uncomputed when their information is no longer needed, especially if residual entanglement would affect measurement.

---

# 8. Qubit ordering and classical-bit mapping

## 8.1 Endianness

A basis state may be represented as

\[
|q_{n-1}\cdots q_1q_0\rangle
\]

or in the reverse software order. The same bit string can therefore appear reversed in printed output.

## 8.2 Integer interpretation

If \(q_0\) is least significant,

\[
x=\sum_{j=0}^{n-1}q_j2^j.
\]

If the framework uses the opposite convention, the interpretation changes.

## 8.3 QFT bit reversal

QFT circuits often produce reversed qubit order unless SWAP gates are included. An output such as 101 may represent the same physical result as its reversal under a different convention.

## 8.4 Measurement mapping

Document the map

\[
\text{quantum qubit }q_j
\longrightarrow
\text{classical bit }c_k.
\]

Do not infer the map from a printed histogram without checking the framework convention.

## 8.5 Ordering test

Use basis states to test ordering:

1. Prepare \(|01\rangle\).
2. Measure without gates.
3. Confirm which displayed bit is associated with each qubit.
4. Apply X to a selected qubit.
5. Confirm the resulting integer interpretation.

---

# 9. Simulation methods

## 9.1 State-vector simulation

A pure \(n\)-qubit state is represented by

\[
|\psi\rangle=\sum_{x=0}^{2^n-1}a_x|x\rangle.
\]

The simulator stores \(2^n\) complex amplitudes. Memory therefore grows exponentially with \(n\).

## 9.2 State-vector memory estimate

If each amplitude uses \(b\) bytes, approximate memory is

\[
M\approx b2^n.
\]

For double-precision complex amplitudes, \(b\) is commonly 16 bytes, before additional simulator overhead.

## 9.3 Shot-based simulation

A shot-based simulator samples measurement outcomes from the state distribution. For a basis state probability

\[
p_x=|a_x|^2,
\]

counts follow a multinomial distribution over repeated shots.

## 9.4 Stabilizer simulation

Circuits composed primarily of Clifford gates can be simulated efficiently using stabilizer methods. Non-Clifford gates such as T may increase simulation cost.

## 9.5 Tensor-network simulation

Tensor-network methods exploit low entanglement or favorable circuit geometry. They can simulate some larger circuits that are difficult for full state-vector methods.

## 9.6 Matrix simulation

For small systems, represent gates as matrices and calculate

\[
|\psi_{\text{out}}\rangle
=U_m\cdots U_2U_1|\psi_{\text{in}}\rangle.
\]

This is useful for educational verification but scales poorly.

## 9.7 Noisy simulation

A noisy simulator applies a noise model such as:

- Depolarizing noise.
- Bit-flip and phase-flip noise.
- Amplitude damping.
- Readout error.
- Gate-dependent noise.

The output is a distribution affected by both quantum dynamics and the noise model.

---

# 10. Circuit metrics

## 10.1 Width

Circuit width is the number of qubits used:

\[
W=\text{number of quantum wires}.
\]

Ancillas are included in the physical width.

## 10.2 Depth

Circuit depth is the number of sequential layers when independent gates can be executed in parallel.

A circuit with many gates may have low depth if gates are parallelizable.

## 10.3 Gate count

The total gate count is

\[
G=\sum_{k}G_k,
\]

where \(G_k\) counts gates of type \(k\).

## 10.4 Two-qubit gate count

Two-qubit gates are often more error-prone than single-qubit gates. Report

\[
G_2=\text{number of two-qubit gates}.
\]

## 10.5 T-count and T-depth

For fault-tolerant circuits, report:

- T-count: number of T gates.
- T-depth: number of sequential T layers.
- Logical-qubit count.
- Ancilla count.

## 10.6 Measurement cost

If an algorithm measures \(L\) observables with \(S\) shots each, the basic sampling cost is approximately

\[
N_{\text{shots}}=LS.
\]

Grouping commuting observables can reduce this cost.

---

# 11. Transpilation and hardware mapping

## 11.1 Native gates

A compiler translates abstract gates into a device’s native gate set. For example, a controlled operation may be decomposed into several single- and two-qubit gates.

## 11.2 Connectivity graph

Hardware connectivity is represented by a graph

\[
G_H=(V_H,E_H),
\]

where vertices are physical qubits and edges represent allowed two-qubit interactions.

## 11.3 Routing

If two logical qubits are not adjacent on hardware, the compiler inserts SWAP gates or uses a different decomposition. Routing increases:

- Depth.
- Two-qubit count.
- Error probability.

## 11.4 Initial layout

A logical-to-physical layout is a map

\[
\pi:V_L\rightarrow V_H.
\]

A good layout places frequently interacting logical qubits on connected physical qubits.

## 11.5 Optimization levels

Compilation may:

- Cancel adjacent inverse gates.
- Merge rotations.
- Commute gates.
- Reduce SWAPs.
- Choose lower-error qubits.
- Optimize pulse schedules.

Optimization can change the visual circuit while preserving its intended operation.

## 11.6 Verify after compilation

Always compare the original and compiled circuits using:

- Unitary equivalence for small circuits.
- State fidelity on test states.
- Measurement-distribution comparison.
- Observable expectation comparison.

---

# 12. Measurement and statistical analysis

## 12.1 Born probabilities

For state

\[
|\psi\rangle=\sum_xa_x|x\rangle,
\]

the computational-basis probability is

\[
P(x)=|a_x|^2.
\]

## 12.2 Frequency estimator

If outcome \(x\) occurs \(n_x\) times in \(S\) shots,

\[
\widehat P(x)=\frac{n_x}{S}.
\]

## 12.3 Standard error

For a binary event with probability \(p\),

\[
\operatorname{SE}(\widehat p)
=\sqrt{\frac{p(1-p)}{S}}.
\]

Use \(\widehat p\) when \(p\) is unknown.

## 12.4 Confidence intervals

A normal approximation gives

\[
\widehat p\pm z_{\alpha/2}
\sqrt{\frac{\widehat p(1-\widehat p)}{S}}.
\]

For small counts or probabilities near 0 or 1, use a binomial or Wilson interval instead of blindly relying on the normal approximation.

## 12.5 Expectation estimation

For observable \(O\), estimate

\[
\langle O\rangle
=\sum_xo_xP(x),
\]

where \(o_x\) is the measurement eigenvalue associated with outcome \(x\).

## 12.6 Comparing two experiments

When comparing estimates \(\widehat p_1\) and \(\widehat p_2\), account for both standard errors:

\[
\operatorname{SE}(\widehat p_1-\widehat p_2)
=\sqrt{\operatorname{SE}_1^2+\operatorname{SE}_2^2}
\]

for independent experiments.

---

# 13. Correctness and verification

## 13.1 Basis-state tests

Test each gate or subroutine on computational-basis states. For a reversible arithmetic operation, verify the output for all small inputs.

## 13.2 Unitarity test

For a matrix implementation, verify

\[
U^\dagger U=I.
\]

A large deviation indicates an implementation or numerical problem.

## 13.3 Inverse test

For a circuit intended to implement \(U\), verify

\[
U^{-1}U|\psi\rangle=|\psi\rangle
\]

on representative states.

## 13.4 Known-state tests

Use known identities:

\[
H|0\rangle=|+\rangle,
\]

\[
H|1\rangle=|-
angle,
\]

\[
X|0\rangle=|1\rangle,
\]

\[
Z|1\rangle=-|1\rangle.
\]

For QPE, use a phase gate with a known eigenphase.

## 13.5 Property-based tests

Test general properties rather than only individual examples:

- Probabilities sum to 1.
- Reversible operations preserve distinct basis states.
- An inverse circuit restores the input.
- Symmetry-related inputs produce symmetry-related outputs.
- A known conserved quantity remains unchanged.

## 13.6 Differential testing

Run the same circuit through:

- A matrix simulator.
- A state-vector simulator.
- A shot-based simulator.
- A compiled circuit.

Compare distributions or expectation values within statistical tolerance.

---

# 14. Algorithm-specific analysis

## 14.1 QPE analysis

For QPE, report:

- Number of counting qubits.
- Target-state preparation fidelity.
- Controlled-power construction.
- Inverse-QFT depth.
- Phase resolution.
- Probability of a close estimate.
- Bit-order convention.

## 14.2 Shor analysis

For Shor’s algorithm, report:

- Integer size.
- Base \(a\).
- Modular-exponentiation cost.
- Exponent-register size.
- Continued-fraction procedure.
- Candidate-order verification.
- Factor-recovery success rate.

## 14.3 Quantum-walk analysis

For a quantum walk, report:

- Graph size and topology.
- Coin or Hamiltonian choice.
- Initial state.
- Marking rule.
- Number of steps or evolution time.
- Position distribution.
- Hitting or marked-state probability.

## 14.4 VQA analysis

For VQAs, report:

- Ansatz architecture.
- Parameter count.
- Initial parameters.
- Optimizer.
- Shot count.
- Objective trajectory.
- Final cost and uncertainty.
- Circuit depth.
- Number of evaluations.

---

# 15. Resource estimation

## 15.1 Logical resources

Logical resource estimates include:

- Logical qubits.
- Logical gate count.
- Circuit depth.
- Measurement rounds.
- Classical processing.

## 15.2 Physical resources

Fault-tolerant implementations require additional physical resources for error correction. A logical qubit may require many physical qubits depending on code distance and error rate.

## 15.3 Width-depth trade-off

Reducing width may increase depth through reuse and uncomputation. Reducing depth may require more ancillas. Report both rather than optimizing only one metric.

## 15.4 Precision-resource trade-off

Higher precision often requires:

- More qubits.
- More controlled powers.
- More shots.
- More accurate rotations.
- More classical post-processing.

For QPE, phase-grid spacing is approximately

\[
2^{-t},
\]

so increasing \(t\) improves nominal precision but increases circuit cost.

## 15.5 Sampling-resource trade-off

The standard error often decreases as

\[
O(S^{-1/2}),
\]

where \(S\) is the number of shots. Achieving ten times smaller statistical error may require roughly one hundred times as many shots.

---

# 16. Noise and error analysis

## 16.1 Error sources

Common sources include:

- Gate infidelity.
- Decoherence.
- Crosstalk.
- Leakage.
- Readout error.
- Calibration drift.
- Compiler approximation.
- Finite sampling.

## 16.2 Error budget

A useful error budget separates

\[
\epsilon_{\text{total}}
\lesssim
\epsilon_{\text{algorithm}}
+\epsilon_{\text{compilation}}
+\epsilon_{\text{device}}
+\epsilon_{\text{sampling}}.
\]

The terms are not always strictly additive, but the decomposition helps identify dominant sources.

## 16.3 Fidelity metrics

State fidelity between pure states is

\[
F(|\psi\rangle,|\phi\rangle)
=|\langle\psi|\phi\rangle|^2.
\]

For a target distribution \(p\) and measured distribution \(q\), useful metrics include:

- Total variation distance.
- Hellinger distance.
- KL divergence when defined.
- Classical fidelity.

## 16.4 Total variation distance

\[
D_{\mathrm{TV}}(p,q)
=\frac12\sum_x|p_x-q_x|.
\]

It measures the largest difference in probability assigned to an event.

## 16.5 Noise scaling

A rough model for survival of a circuit with \(G_2\) noisy two-qubit gates is

\[
P_{\text{survival}}
\approx(1-\epsilon_2)^{G_2},
\]

where \(\epsilon_2\) is an average two-qubit error rate. This is only a simplified estimate; correlated errors and gate-dependent noise can change behavior.

---

# 17. Benchmarking and reproducibility

## 17.1 Benchmark design

A benchmark should specify:

- Problem family.
- Input-size range.
- Circuit-generation method.
- Backend.
- Noise model.
- Number of runs.
- Number of shots.
- Metrics.
- Statistical analysis.

## 17.2 Scaling study

For input sizes \(n=2,3,4,\ldots\), record:

\[
(n,\text{width},\text{depth},G,G_2,\text{shots},\text{error}).
\]

Fit empirical scaling only over a justified range.

## 17.3 Repeated trials

Randomized algorithms and noisy experiments require repeated trials. Report mean, variance, median, and confidence intervals when appropriate.

## 17.4 Seed control

Record random seeds for:

- Parameter initialization.
- Random circuit generation.
- Noise sampling.
- Input generation.
- Optimizer stochasticity.

## 17.5 Reproducible artifact

A reproducible experiment should include:

- Source code.
- Dependency versions.
- Circuit definitions.
- Input data.
- Configuration files.
- Seeds.
- Raw counts.
- Analysis scripts.
- Environment information.

---

# 18. Debugging checklist

## 18.1 State and register bugs

Check:

- Number of qubits.
- Initial state.
- Register order.
- Ancilla initialization.
- Uncomputation.

## 18.2 Gate bugs

Check:

- Gate parameter units: radians versus degrees.
- Control and target order.
- Gate sequence.
- Inverse gates.
- Controlled-power exponent.
- Missing phase rotations.

## 18.3 Measurement bugs

Check:

- Measurement basis.
- Classical-bit mapping.
- Bit-string reversal.
- Number of shots.
- Histogram interpretation.

## 18.4 Numerical bugs

Check:

- Normalization.
- Floating-point tolerance.
- Matrix dimensions.
- Complex conjugation.
- Stable probability calculations.

## 18.5 Hardware bugs

Check:

- Backend availability.
- Calibration data.
- Coupling map.
- Transpiler output.
- Queue and job status.
- Readout calibration.

---

# 19. Worked implementation studies

## 19.1 QPE implementation study

A small QPE study can use

\[
U=R_2
=\begin{bmatrix}1&0\\0&i\end{bmatrix}
\]

with target \(|1\rangle\). Since

\[
R_2|1\rangle=i|1\rangle
=e^{2\pi i/4}|1\rangle,
\]

the phase is \(1/4\). Use two counting qubits and verify that the inverse-QFT measurement returns the corresponding bit string, accounting for ordering.

## 19.2 Shor demonstration study

For \(N=15\) and \(a=2\):

1. Calculate the period classically for verification.
2. Build or simulate modular exponentiation.
3. Apply Fourier analysis to the exponent register.
4. Sample \(c/Q\).
5. Apply continued fractions.
6. Verify candidate order \(r=4\).
7. Calculate gcd factors 3 and 5.

## 19.3 Quantum-walk study

For a four-vertex cycle:

1. Encode the position with two qubits.
2. Add a coin qubit.
3. Apply a Hadamard coin.
4. Implement modular conditional shifts.
5. Measure position after several steps.
6. Compare with a classical random walk.

## 19.4 VQE study

For \(H=Z\):

1. Prepare \(|0\rangle\).
2. Apply \(R_y(\theta)\).
3. Measure Z.
4. Estimate \(E(\theta)=\cos\theta\).
5. Optimize \(\theta\).
6. Verify that \(\theta=\pi\) gives energy -1.

---

# 20. Chapter summary

Quantum algorithm implementation requires more than translating equations into gate calls. A reliable workflow specifies the problem, registers, state preparation, unitary decomposition, measurement map, execution backend, statistical procedure, and verification tests.

Important circuit resources include width, depth, total gate count, two-qubit gate count, T-count, T-depth, ancillas, and measurement shots.

Simulation methods include state-vector, shot-based, stabilizer, tensor-network, matrix, and noisy simulation. Each has different scaling and applicability.

Transpilation maps logical circuits to native gates and hardware connectivity. Routing can add SWAP gates, depth, and noise. Qubit ordering and classical-bit mapping must always be tested explicitly.

Measurement results are estimates. For a probability \(p\), the sampling error generally scales as

\[
O(S^{-1/2}).
\]

Correctness should be checked through basis-state tests, inverse tests, unitarity checks, known identities, differential testing, and conservation laws.

A complete algorithm analysis reports correctness, accuracy, resources, noise, uncertainty, scaling, and reproducibility. This applies to QPE, Shor’s algorithm, quantum walks, VQAs, and other quantum algorithms.

---

# 21. Formula sheet

State representation:

\[
|\psi\rangle=\sum_xa_x|x\rangle.
\]

Basis probability:

\[
P(x)=|a_x|^2.
\]

State-vector memory:

\[
M\approx b2^n.
\]

Probability estimator:

\[
\widehat P(x)=\frac{n_x}{S}.
\]

Binary-event standard error:

\[
\operatorname{SE}(\widehat p)
=\sqrt{\frac{p(1-p)}{S}}.
\]

QPE resolution:

\[
\Delta\phi\approx2^{-t}.
\]

Circuit width:

\[
W=\text{number of qubits}.
\]

Total variation distance:

\[
D_{\mathrm{TV}}(p,q)
=\frac12\sum_x|p_x-q_x|.
\]

Pure-state fidelity:

\[
F=|\langle\psi|\phi\rangle|^2.
\]

Approximate survival model:

\[
P_{\mathrm{survival}}
\approx(1-\epsilon_2)^{G_2}.
\]

---

# 22. Review questions and exercises

## Conceptual questions

1. What are the stages of a quantum algorithm implementation?
2. What is circuit width?
3. What is circuit depth?
4. Why are two-qubit gates often reported separately?
5. What is transpilation?
6. Why does hardware connectivity matter?
7. What is qubit endianness?
8. How is a probability estimated from shots?
9. What is sampling error?
10. How can a circuit be verified?
11. Compare state-vector and tensor-network simulation.
12. What is differential testing?
13. What should be included in a reproducible benchmark?
14. How do noise and compiler routing affect results?

## Numerical exercises

1. Calculate the number of amplitudes for 5, 10, and 20 qubits.
2. Estimate state-vector memory using 16 bytes per amplitude.
3. Calculate the standard error for \(p=0.25\) and \(S=1000\).
4. Calculate total variation distance for two small distributions.
5. Estimate survival probability for \(G_2=100\) and \(\epsilon_2=0.01\).
6. Count the controlled rotations in a QFT circuit.
7. Compare shot cost for 10 observables with 1,000 shots each.
8. Calculate the phase-grid spacing for 8 counting qubits.

## Implementation exercises

1. Write a basis-state test for X, H, and CNOT.
2. Verify that a circuit followed by its inverse restores several states.
3. Implement a qubit-ordering test.
4. Compare an abstract and transpiled QFT circuit.
5. Estimate depth and two-qubit count before and after routing.
6. Simulate a noisy QPE circuit.
7. Compare ideal and noisy quantum-walk distributions.
8. Analyze a VQE cost trajectory with confidence intervals.
9. Build a reproducible benchmark table.
10. Write a report containing algorithmic, circuit, execution, and scientific validity checks.

---

# 23. Glossary

**Circuit depth:** The number of sequential operation layers.

**Circuit width:** The number of quantum wires or qubits.

**Differential testing:** Comparing independent implementations of the same algorithm.

**Endianness:** The convention used to order qubits and bits in an integer representation.

**Fidelity:** A measure of similarity between quantum states.

**Sampling error:** Statistical error caused by estimating probabilities from a finite number of shots.

**Transpilation:** Compilation of an abstract circuit into a hardware-supported circuit.

**Verification:** Testing whether an implementation behaves according to its mathematical specification.

---

# References

[1]: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information "IBM Quantum Learning: Basics of Quantum Information"

[2]: https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice "IBM Quantum Learning: Quantum Computing in Practice"

[3]: https://doi.org/10.1103/RevModPhys.68.1049 "Quantum Computation and Quantum Information by Michael A. Nielsen and Isaac L. Chuang"

[4]: https://doi.org/10.48550/arXiv.1803.11114 "Quantum algorithm implementations and resource estimation"

[5]: https://doi.org/10.1103/PhysRevA.98.042308 "Quantum volume and quantum-computing performance"

[6]: https://doi.org/10.1038/s41586-019-1666-5 "Quantum supremacy using a programmable superconducting processor"

## Key formulas: derivation and interpretation

### Statevector size and measurement estimation

An n-qubit state requires:

\[
2^n\text{ complex amplitudes}.
\]

This follows because each of n qubits has two basis values, giving \(2^n\) bit strings. For a measurement outcome with probability p, the empirical frequency from M shots is:

\[
\hat p=\frac{k}{M},
\]

where k is the number of times the outcome appears. The sampling uncertainty is approximately proportional to \(1/\sqrt M\), so more shots improve probability estimates.

### Circuit resource summary

A simple implementation analysis records qubit count, gate count, circuit depth, number of two-qubit gates, shots, and classical post-processing cost. These quantities connect the mathematical algorithm to actual hardware resources.


## Chapter assessment
### One-mark questions and answers

1. **Question:** What is statevector simulation?
   **Answer:** Classically evolving the amplitude vector of a quantum circuit.

2. **Question:** What is an oracle implementation?
   **Answer:** A circuit realization of a problem-dependent black-box operation.

3. **Question:** What is circuit depth?
   **Answer:** The number of sequential gate layers.

4. **Question:** Why are repeated shots needed?
   **Answer:** To estimate measurement probabilities.

5. **Question:** Name two noise sources.
   **Answer:** Gate errors, decoherence, readout errors, or connectivity constraints.

### Chapter quiz

1. What is statevector simulation?

2. What is an oracle implementation?

3. What is circuit depth?

4. Why are repeated shots needed?

5. Name two noise sources.

### Quiz answer key

1. **Classically evolving the amplitude vector of a quantum circuit.**

2. **A circuit realization of a problem-dependent black-box operation.**

3. **The number of sequential gate layers.**

4. **To estimate measurement probabilities.**

5. **Gate errors, decoherence, readout errors, or connectivity constraints.**


---

# Module 3 final revision checklist

- Can you explain what an oracle does and how query complexity is measured?
- Can you trace the Hadamard, oracle, inverse-QFT, and measurement stages?
- Can you distinguish exact, bounded-error, query, gate, time, and space complexity?
- Can you explain how QFT and QPE support period finding?
- Can you analyze circuit depth, gate count, shots, and noise?
