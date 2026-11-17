import type { Lesson } from './lessons';

/**
 * Q-Loop Module 3, Chapter 1
 * Source: supplied Module 3 textbook, Chapter 1.
 *
 * Content is reorganized for lesson-by-lesson display. Mathematical expressions
 * use Markdown/KaTeX delimiters. Assessment questions and answers are retained
 * as lesson content because the source does not provide multiple-choice options.
 */
export const MODULE3_CHAPTER_01: Lesson = {
  id: 'module-3-chapter-01',
  moduleId: 'module-3',
  title: 'Introduction to Quantum Algorithms',
  description:
    'Foundations of quantum algorithms, their structure, complexity, major families, practical limitations, and introductory examples.',
  duration: 90,
  difficulty: 'Beginner',
  objectives: [
    'Define a quantum algorithm.',
    'Distinguish a quantum algorithm from a quantum circuit.',
    'Identify the common stages of a quantum algorithm.',
    'Explain the roles of superposition, interference, and entanglement.',
    'Understand oracle-based problem models.',
    'Describe query complexity and computational complexity.',
    'Distinguish exponential, polynomial, and quadratic speedups.',
    'Explain why measurement is usually delayed until the end.',
    'Identify major families of quantum algorithms.',
    'Compare ideal quantum speedup with practical hardware performance.',
    'Describe hybrid quantum-classical algorithms.',
    'Analyze simple quantum-algorithm circuits.',
  ],
  content: [
    {
      heading: '1.1 Chapter overview',
      body: String.raw`## What is a quantum algorithm?

- A **quantum algorithm** is a step-by-step computational procedure designed to run on a quantum computer.
- Like a classical algorithm, it:
  - Receives an input.
  - Performs a sequence of operations.
  - Produces an output.
- A quantum algorithm uses:
  - Quantum states.
  - Unitary gates.
  - Superposition.
  - Interference.
  - Entanglement.
  - Measurement.

## Quantum algorithms do not make every problem faster

- A quantum algorithm does **not** automatically make every problem faster.
- Its advantage depends on whether the problem has a structure that can be exploited by quantum mechanics.
- Successful algorithms carefully arrange amplitudes so that:
  - Useful answers become more likely.
  - Unhelpful answers interfere destructively.

## Typical workflow

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

~~~mermaid
flowchart TD
 A[Initialize qubits] --> B[Prepare a quantum state]
 B --> C[Encode problem information]
 C --> D[Create useful interference]
 D --> E[Measure the quantum state]
 E --> F[Classically interpret the result]
~~~

## Important examples

- **Deutsch’s algorithm:** demonstrates a quantum query advantage for a simple function problem.
- **Deutsch–Jozsa algorithm:** distinguishes constant and balanced functions with fewer queries than a deterministic classical procedure.
- **Bernstein–Vazirani algorithm:** identifies a hidden bit string using one oracle query.
- **Grover’s search algorithm:** provides a quadratic speedup for unstructured search.
- **Shor’s factoring algorithm:** uses period finding and the quantum Fourier transform.
- **Quantum phase estimation:** estimates eigenvalue phases of unitary operators.
- **Variational quantum algorithms:** examples include VQE and QAOA; they combine quantum circuits with classical optimization.

## Main lesson

- Quantum speedup must be analyzed carefully.
- The algorithm, problem structure, oracle, circuit resources, measurement cost, and classical processing all matter.`,
    },
    {
      heading: '1.2 Learning objectives',
      body: String.raw`After studying this chapter, learners should be able to:

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
12. Analyze simple quantum-algorithm circuits.`,
    },
    {
      heading: '2. What is a quantum algorithm?',
      body: String.raw`## 2.1 Definition

- A **quantum algorithm** is an algorithm whose computational steps are implemented using quantum operations.
- It acts on qubits.
- It produces a probability distribution over classical measurement outcomes.

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

- A **quantum circuit** is a particular arrangement of gates and measurements.
- A **quantum algorithm** includes the larger problem-solving procedure:
  - How the input is encoded.
  - Which circuit is constructed.
  - How many times it is executed.
  - How measurement results are processed.
  - How success is verified.
- A circuit is therefore one implementation component of an algorithm.

### Example: Grover’s algorithm

A complete Grover algorithm includes:

1. A description of the search problem.
2. An oracle that marks the desired item.
3. A diffusion operation.
4. A choice of iteration count.
5. Measurement and result verification.

- The circuit implements the oracle and diffusion steps.
- The complete algorithm includes all five parts.

## 2.3 Input, computation, and output

### Input

The input may be encoded as:

- A computational-basis state.
- A quantum state supplied by another process.
- Parameters in a circuit.
- An oracle describing a function.
- A Hamiltonian or matrix.

### Computation

The computation consists of:

- Quantum gates.
- Controlled operations.
- Oracle calls.
- Sometimes intermediate measurements or resets.

### Output

- The output is usually a classical bit string or an estimated quantity.
- Measurement is probabilistic.
- An algorithm may therefore need many circuit executions.`,
    },
    {
      heading: '3. Why quantum algorithms can be useful',
      body: String.raw`## 3.1 Quantum resources

### Superposition

A register can represent a combination of many computational-basis states:

\[
|\psi\rangle=\sum_x\alpha_x|x\rangle.
\]

- Superposition gives an algorithm access to many amplitude components.
- It does **not** mean that all answers can be read out simultaneously.
- Measurement returns only one outcome per shot.

### Interference

- Interference changes amplitudes through addition and cancellation.
- An algorithm must arrange the phases so that:
  - Desired states are amplified.
  - Undesired states are suppressed.

### Entanglement

- Entanglement creates non-separable relationships between qubits.
- It enables joint transformations and correlations that cannot be reproduced by independent single-qubit operations.

### Quantum parallelism

Quantum parallelism refers to applying a reversible operation to a superposition of inputs:

\[
U\left(\sum_x\alpha_x|x\rangle\right)
=\sum_x\alpha_xU|x\rangle.
\]

- Quantum parallelism alone is not a speedup.
- The algorithm must use interference and measurement to extract useful global information.

## 3.2 The information-extraction problem

- A register with \(n\) qubits has \(2^n\) basis states.
- Measuring it gives only one \(n\)-bit string per shot.
- This creates a central design challenge:

> How can an algorithm use exponentially many amplitudes while extracting only a useful amount of classical information?

Quantum algorithms solve this through structure. They do not generally reveal every amplitude. Instead, they estimate a property such as:

- Whether a function is constant or balanced.
- The location of a marked item.
- The period of a function.
- The phase of an eigenvalue.
- The ground-state energy of a Hamiltonian.
- An approximate solution to an optimization problem.

## 3.3 Problem structure and quantum advantage

- Quantum advantage is problem-dependent.
- A quantum algorithm is useful when its circuit can exploit a structure that is difficult for the best known classical method.

Examples:

- Periodicity can be extracted with the quantum Fourier transform.
- Unstructured search can be amplified using Grover iterations.
- Quantum systems can be represented naturally for simulation.
- Eigenvalue phases can be estimated using controlled powers of a unitary.

**Important:** A high qubit count alone does not establish algorithmic advantage.`,
    },
    {
      heading: '4. The anatomy of a quantum algorithm',
      body: String.raw`## 4.1 Initialization

Most algorithms begin with qubits in

\[
|0\rangle^{\otimes n}.
\]

Initialization may also include preparing:

- An input basis state.
- A known eigenstate.
- A variational state.
- An entangled resource state.

## 4.2 State preparation

Hadamard gates are frequently used to prepare a uniform superposition:

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}
\sum_{x\in\{0,1\}^n}|x\rangle.
\]

- Other state-preparation circuits encode data.
- They may also construct problem-specific trial states.

## 4.3 Oracle or problem encoding

- An **oracle** is a reversible operation that encodes information about a problem.
- The algorithm can query the oracle but does not necessarily inspect its internal implementation.

A standard function oracle is

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

- The input register stores \(x\).
- The output register stores \(y\).
- The function value is added modulo 2.

An oracle may also mark a state by phase:

\[
O_f|x\rangle=(-1)^{f(x)}|x\rangle.
\]

- When \(f(x)=1\), the phase of \(|x\rangle\) is flipped.

## 4.4 Interference stage

After encoding information, the algorithm applies gates that combine amplitudes.

- The purpose is to make the probability distribution informative.
- For a general state,

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

The final quantum state is measured. Results may be:

- A candidate answer.
- An estimate of an expectation value.
- A bit string indicating a function property.
- A phase estimate.
- A sample from a distribution.

The classical computer may:

- Repeat the circuit.
- Calculate frequencies.
- Calculate averages.
- Calculate variances.
- Calculate objective functions.

## 4.6 Verification

A practical algorithm should include a way to check the output. Verification may involve:

- Evaluating a candidate solution classically.
- Checking a parity or constraint.
- Comparing with a known small instance.
- Estimating confidence intervals.
- Repeating with different random seeds or circuit parameters.

**Key point:** Quantum speedup is not useful if the output cannot be verified efficiently or reliably.`,
    },
    {
      heading: '5. Quantum algorithm complexity',
      body: String.raw`## 5.1 Time complexity

Time complexity describes how computational resources grow with input size.

In a quantum setting, the cost may include:

- Number of gates.
- Circuit depth.
- Number of oracle calls.
- Number of shots.
- Number of qubits.
- Classical post-processing time.
- Data-loading cost.

A claimed speedup must specify which resource is being compared.

## 5.2 Query complexity

- **Query complexity** is the number of times an algorithm accesses an oracle.
- Many introductory algorithms are analyzed using this measure.

Example:

- Classical unstructured search may need \(O(N)\) queries.
- Grover’s algorithm uses \(O(\sqrt N)\) queries.

This is a meaningful theoretical speedup, but total runtime also includes:

- Oracle construction.
- Circuit execution.
- Measurement.
- Verification.

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

- The speedup must be stated relative to the best known classical algorithm.
- The input model must also be specified.

## 5.4 Query advantage versus practical advantage

- Grover’s algorithm has a quadratic query advantage.
- A practical implementation must account for:
  - Oracle construction.
  - Gate decomposition.
  - Circuit depth.
  - Number of shots.
  - Hardware noise.
  - Classical search baselines.
- A theoretical query advantage may not immediately produce a wall-clock advantage on current hardware.

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

although the strictness of several relationships is unknown.`,
    },
    {
      heading: '6. Major families of quantum algorithms',
      body: String.raw`## 6.1 Simulation algorithms

- Quantum simulation algorithms model:
  - Molecules.
  - Materials.
  - Lattice systems.
  - Other quantum dynamics.
- They use the fact that quantum states can represent quantum systems naturally.

Common techniques include:

- Hamiltonian simulation.
- Trotter-Suzuki product formulas.
- Quantum phase estimation.
- Variational eigensolvers.
- Quantum imaginary-time methods.

## 6.2 Search and amplitude amplification

- Grover’s algorithm searches an unstructured space in approximately

\[
O(\sqrt N)
\]

queries.
- Amplitude amplification generalizes this idea to improve the success probability of a quantum subroutine.

## 6.3 Fourier-transform and period-finding algorithms

The quantum Fourier transform transforms phase and periodicity information.

It is used in:

- Shor’s factoring algorithm.
- Quantum phase estimation.
- Hidden-subgroup algorithms.
- Period-finding procedures.

## 6.4 Query and oracle algorithms

Oracle algorithms study how many black-box queries are needed to learn a property of a function.

Examples:

- Deutsch’s algorithm.
- Deutsch–Jozsa.
- Bernstein–Vazirani.
- Simon’s algorithm.
- Grover’s algorithm.

These algorithms are valuable because they isolate the power of quantum queries.

## 6.5 Variational and hybrid algorithms

Variational algorithms use a parameterized circuit

\[
|\psi(\boldsymbol\theta)\rangle
=U(\boldsymbol\theta)|0\rangle^{\otimes n}
\]

and a classical optimizer.

- The quantum processor estimates a cost function.
- The classical computer updates \(\boldsymbol\theta\).

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

Quantum machine-learning methods use:

- Quantum feature maps.
- Kernels.
- Parameterized circuits.
- Quantum sampling.

Their practical advantage remains problem- and data-dependent.`,
    },
    {
      heading: '7. Introductory example: Deutsch’s algorithm',
      body: String.raw`## 7.1 Problem statement

Given a function

\[
f:\{0,1\}\rightarrow\{0,1\},
\]

the function is promised to be either:

- **Constant:** \(f(0)=f(1)\).
- **Balanced:** \(f(0)\neq f(1)\).

Goal: determine whether \(f\) is constant or balanced.

- A deterministic classical method may need two evaluations.
- Deutsch’s quantum algorithm needs one oracle query.

## 7.2 Oracle

The reversible oracle is

\[
U_f|x\rangle|y\rangle
=|x\rangle|y\oplus f(x)\rangle.
\]

## 7.3 Circuit structure

Starting with \(|0\rangle|1\rangle\), apply H to both qubits:

~~~text
q0: ──H──────Uf────H──M──
q1: ──H──────Uf──────────
~~~

The second qubit becomes

\[
|-\rangle=\frac{|0\rangle-|1\rangle}{\sqrt2}.
\]

The oracle produces phase kickback:

\[
U_f|x\rangle|-\rangle
=(-1)^{f(x)}|x\rangle|-\rangle.
\]

- The function value is encoded into the phase of the first-register amplitudes.
- The final H converts that phase information into a computational-basis result.

## 7.4 Result

The first qubit is measured as:

- 0 if the function is constant.
- 1 if the function is balanced.

**Lesson:** The algorithm demonstrates that a quantum algorithm can use phase and interference to learn a global property of a function.`,
    },
    {
      heading: '8. Introductory example: Deutsch–Jozsa algorithm',
      body: String.raw`## 8.1 Problem

The Deutsch–Jozsa problem receives a function

\[
f:\{0,1\}^n\rightarrow\{0,1\}
\]

with the promise that it is either:

- **Constant:** the same output for every input.
- **Balanced:** 0 for exactly half the inputs and 1 for the other half.

## 8.2 Query complexity

A deterministic classical algorithm may require

\[
2^{n-1}+1
\]

queries in the worst case.

The quantum algorithm uses one oracle query.

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

- Deutsch–Jozsa is mainly a demonstration of query complexity and interference.
- It is not automatically a practical speedup for every real-world problem.`,
    },
    {
      heading: '9. Introductory example: Grover’s algorithm',
      body: String.raw`## 9.1 Search problem

Suppose one marked item exists in an unstructured database of \(N\) possibilities.

- A classical search requires an average of about \(N/2\) queries.
- Grover’s algorithm requires approximately

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

The diffusion operator reflects amplitudes around their average.

\[
D=2|s\rangle\langle s|-I,
\]

where \(|s\rangle\) is the uniform superposition.

One Grover iteration is

\[
G=DO.
\]

- Repeated applications rotate the state toward the marked item.

## 9.4 Approximate iteration count

The optimal number of iterations is approximately

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

- Too few iterations do not amplify the marked state enough.
- Too many iterations can rotate past the maximum success probability.

## 9.5 Practical limitations

- Grover’s speedup is quadratic, not exponential.
- The oracle must be implemented.
- The number of gates inside the oracle may dominate the total cost.
- Noise also limits the useful number of iterations.`,
    },
    {
      heading: '10. Introductory example: Shor’s algorithm',
      body: String.raw`## 10.1 Factoring problem

- Given a composite integer \(N\), Shor’s algorithm finds its nontrivial factors in expected polynomial time under standard assumptions.
- Factoring is important because widely used public-key cryptosystems rely on the difficulty of factoring large integers.

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

The quantum part:

1. Prepares a superposition of inputs.
2. Computes modular exponentiation coherently.
3. Applies the quantum Fourier transform.
4. Measures to obtain information about the period.

A classical continued-fraction procedure then uses the measured information to estimate \(r\).

- The complete algorithm is hybrid.
- Quantum period estimation is combined with classical arithmetic and number theory.

## 10.4 Lesson

- Shor’s algorithm demonstrates how a quantum Fourier transform can reveal periodic structure.
- A quantum algorithm may contain substantial classical processing around a quantum subroutine.`,
    },
    {
      heading: '11. Quantum phase estimation',
      body: String.raw`## 11.1 Problem

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

It illustrates the use of:

- Controlled operations.
- Phase kickback.
- The quantum Fourier transform.`,
    },
    {
      heading: '12. Variational quantum algorithms',
      body: String.raw`## 12.1 Hybrid structure

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

- The **variational quantum eigensolver** estimates the ground-state energy of a Hamiltonian \(H\).
- The variational principle gives

\[
E(\boldsymbol\theta)
=\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle
\ge E_0,
\]

where \(E_0\) is the true ground-state energy.

- The algorithm searches for parameters that make \(E(\boldsymbol\theta)\) as small as possible.

## 12.3 QAOA

The **quantum approximate optimization algorithm** uses alternating problem and mixer operators:

\[
|\boldsymbol\gamma,\boldsymbol\beta\rangle
=\prod_{p}e^{-i\beta_pB}e^{-i\gamma_pC}|+\rangle^{\otimes n}.
\]

- The parameters are optimized to increase the expected value of a cost function.
- QAOA is designed for combinatorial optimization.
- QAOA is a hybrid quantum-classical algorithm.

## 12.4 Challenges

Variational algorithms face:

- Barren plateaus.
- Sampling noise.
- Classical optimizer instability.
- Expressibility versus trainability trade-offs.
- Circuit-depth limitations.
- Measurement overhead.
- Hardware noise.`,
    },
    {
      heading: '13. The role of measurement and probability',
      body: String.raw`## 13.1 One run is one sample

- A quantum algorithm does not normally return a complete probability distribution from one circuit execution.
- One shot produces one classical output.

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

- Each term may require separate measurement settings.
- Many shots may be needed.

## 13.4 Confidence and error

Measured frequencies are estimates.

A responsible quantum algorithm report should include:

- Number of shots.
- Estimated probabilities or expectation values.
- Statistical uncertainty.
- Hardware or noise conditions.
- Verification method.`,
    },
    {
      heading: '14. Quantum algorithms on real hardware',
      body: String.raw`## 14.1 Ideal versus practical algorithms

An ideal algorithm assumes:

- Exact gates.
- Perfect state preparation.
- Perfect measurement.

A real implementation faces:

- Gate errors.
- Decoherence.
- Readout errors.
- Limited connectivity.
- Compiler overhead.
- Queue and calibration changes.
- Finite shot budgets.

The practical algorithm must be adapted to the platform.

## 14.2 Circuit depth and noise

- A useful approximation is that deeper circuits accumulate more error.
- If an algorithm requires many oracle iterations, Fourier-transform layers, or variational repetitions, the output distribution can become unreliable.

Algorithm designers therefore optimize:

- Gate count.
- Two-qubit gate count.
- Circuit depth.
- Number of measurement settings.
- Number of shots.
- Qubit mapping.

## 14.3 Classical baselines

Every claimed quantum advantage should be compared with a strong classical baseline.

The comparison should use:

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
- Measure error rates and correlations.`,
    },
    {
      heading: '15. Common misconceptions',
      body: String.raw`## Misconception 1: Quantum algorithms try every answer and read them all

- A superposition contains many amplitudes.
- Measurement returns limited classical information.
- Interference is required to make useful answers more likely.

## Misconception 2: Quantum computers make every algorithm faster

- Speedup is problem-dependent.
- Some problems have no known quantum advantage.

## Misconception 3: Exponential state-space size automatically gives exponential speedup

- A quantum state may have exponentially many amplitudes.
- Extracting useful information and implementing the circuit can still be difficult.

## Misconception 4: One successful shot proves an algorithm works

- A result must be statistically analyzed.
- It must be compared against expected probabilities and classical baselines.

## Misconception 5: An oracle is free in practice

- Oracle query complexity treats the oracle as a black box.
- Building and decomposing the oracle may be the dominant practical cost.

## Misconception 6: Entanglement alone guarantees speedup

- Entanglement is a resource, not a universal guarantee of computational advantage.
- The entire algorithm and problem structure matter.

## Misconception 7: A quantum algorithm must be entirely quantum

Many important algorithms use:

- Classical input preparation.
- Optimization.
- Arithmetic.
- Verification.
- Post-processing.

## Misconception 8: Variational algorithms always work on NISQ hardware

They are designed for near-term systems but still face:

- Noise.
- Measurement overhead.
- Barren plateaus.
- Optimization difficulties.`,
    },
    {
      heading: '16. Chapter summary',
      body: String.raw`- A quantum algorithm is a problem-solving procedure that uses quantum states and operations before producing a classical result.
- A quantum circuit is one component of the complete algorithm.

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

- Superposition provides a space of amplitudes.
- Entanglement creates joint quantum relationships.
- Interference shapes the probability distribution.
- Quantum parallelism alone does not provide a speedup because measurement reveals only limited classical information.
- Quantum algorithms are analyzed using resources such as:
  - Gate count.
  - Circuit depth.
  - Qubit count.
  - Oracle queries.
  - Shots.
  - Classical post-processing.
- Examples of algorithmic speedups include:
  - Grover’s quadratic search speedup.
  - Shor’s polynomial-time factoring algorithm under its computational assumptions.
- Major algorithm families include:
  - Oracle algorithms.
  - Search and amplitude amplification.
  - Fourier-transform and period-finding methods.
  - Quantum simulation.
  - Phase estimation.
  - Variational hybrid algorithms.
- A practical quantum algorithm must be tested with ideal simulation, noisy simulation, and hardware execution when possible.
- It must be compared against a strong classical baseline and evaluated with statistical and hardware-aware discipline.`,
    },
    {
      heading: '17. Formula sheet',
      body: String.raw`### Quantum algorithm state evolution

\[
|\psi_{\text{final}}\rangle=U|\psi_0\rangle.
\]

### Uniform superposition

\[
H^{\otimes n}|0\rangle^{\otimes n}
=\frac{1}{\sqrt{2^n}}\sum_x|x\rangle.
\]

### Function oracle

\[
U_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle.
\]

### Phase oracle

\[
O_f|x\rangle=(-1)^{f(x)}|x\rangle.
\]

### Measurement probability

\[
P(x)=|\langle x|\psi\rangle|^2.
\]

### Grover iteration estimate

\[
k\approx\frac{\pi}{4}\sqrt N.
\]

### Phase estimation eigenvalue relation

\[
U|\psi\rangle=e^{2\pi i\phi}|\psi\rangle.
\]

### Variational state

\[
|\psi(\boldsymbol\theta)\rangle=U(\boldsymbol\theta)|0\rangle^{\otimes n}.
\]

### VQE energy

\[
E(\boldsymbol\theta)=
\langle\psi(\boldsymbol\theta)|H|\psi(\boldsymbol\theta)\rangle
\ge E_0.
\]

### Expectation value

\[
\langle O\rangle=\langle\psi|O|\psi\rangle.
\]

### Shot-count deviation

\[
\sigma_N=\sqrt{Np(1-p)}.
\]

### At-least-one-success probability

\[
P(\text{success at least once})=1-(1-p)^N.
\]`,
    },
    {
      heading: '18. Review questions and exercises',
      body: String.raw`## Conceptual questions

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
9. Compare the quantum circuit with a classical baseline.`,
    },
    {
      heading: '19. Glossary',
      body: String.raw`- **Amplitude amplification:** A family of techniques that increases the probability of desired quantum states.
- **Classical post-processing:** Computation performed on measurement results by a classical computer.
- **Quantum algorithm:** A problem-solving procedure implemented using quantum states and operations.
- **Quantum Fourier transform:** A quantum transformation that reveals phase and periodicity information.
- **Oracle:** A reversible operation that encodes information about a problem or function.
- **Query complexity:** The number of oracle calls made by an algorithm.
- **Variational algorithm:** A hybrid algorithm that optimizes parameters of a quantum circuit using a classical computer.
- **Phase estimation:** An algorithmic method for estimating the phase of a unitary eigenvalue.
- **Speedup:** Improvement in computational-resource scaling relative to a classical method.
- **Success probability:** The probability that one circuit execution produces an acceptable answer.`,
    },
    {
      heading: 'References',
      body: String.raw`1. [IBM Quantum Learning: Basics of Quantum Information](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information)
2. [IBM Quantum Learning: Quantum Computing in Practice](https://qiskit.qotlabs.org/learning/courses/quantum-computing-in-practice)
3. [Quantum Computation and Quantum Information, Michael A. Nielsen and Isaac L. Chuang](https://doi.org/10.1103/RevModPhys.68.1049)
4. [A fast quantum mechanical algorithm for database search](https://doi.org/10.1103/PhysRevLett.79.325)
5. [Algorithms for quantum computation: discrete logarithms and factoring](https://doi.org/10.1109/SFCS.1994.365700)
6. [John Preskill: Lecture Notes for Physics 229, Quantum Information and Computation](https://theory.caltech.edu/~preskill/ph229/)
7. [National Institute of Standards and Technology: Quantum Information Science](https://www.nist.gov/quantum-information-science)`,
    },
    {
      heading: 'Key formulas: derivation and interpretation',
      body: String.raw`## Query complexity

\[
Q_A(f)=\text{number of oracle queries made by algorithm }A.
\]

**Derivation and interpretation**

- In an oracle model, the input function is accessed only through a black-box query.
- Counting those calls gives query complexity.
- This isolates the information-gathering cost from other gates and classical processing.

## General quantum state

\[
|\psi\rangle=\sum_x\alpha_x|x\rangle,
\qquad \sum_x|\alpha_x|^2=1.
\]

**Derivation and interpretation**

- The basis states \(|x\rangle\) are possible computational inputs.
- The coefficients \(\alpha_x\) are amplitudes.
- Normalization follows because the probabilities \(|\alpha_x|^2\) must sum to one.
- Quantum speedup comes from transforming these amplitudes with interference.
- Superposition alone does not guarantee speedup.`,
    },
    {
      heading: 'Chapter assessment: one-mark questions and answers',
      body: String.raw`1. **Question:** What is a quantum algorithm?

   **Answer:** A procedure that uses quantum states, gates, measurement, and quantum effects to solve a computational problem.

2. **Question:** What is query complexity?

   **Answer:** The number of oracle or black-box queries made by an algorithm.

3. **Question:** Name three quantum resources.

   **Answer:** Superposition, interference, and entanglement.

4. **Question:** What is an oracle?

   **Answer:** A black-box operation that encodes a problem-dependent function.

5. **Question:** What is quantum speedup?

   **Answer:** An improvement in resource use compared with a specified classical method.`,
    },
    {
      heading: 'Chapter quiz',
      body: String.raw`Answer each question using the chapter content.

1. What is a quantum algorithm?
2. What is query complexity?
3. Name three quantum resources.
4. What is an oracle?
5. What is quantum speedup?`,
    },
    {
      heading: 'Quiz answer key',
      body: String.raw`1. **A procedure that uses quantum states, gates, measurement, and quantum effects to solve a computational problem.**
2. **The number of oracle or black-box queries made by an algorithm.**
3. **Superposition, interference, and entanglement.**
4. **A black-box operation that encodes a problem-dependent function.**
5. **An improvement in resource use compared with a specified classical method.**`,
    },
  ],
  // The supplied textbook provides written review and assessment questions,
  // but no multiple-choice options. Keep them in content rather than inventing
  // MCQs to populate this structured quiz array.
  quiz: [],
};
