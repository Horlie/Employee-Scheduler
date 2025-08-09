# 🏥 Employee Scheduler for Hospitals

This project is a **hospital employee shift scheduling system** that intelligently generates optimal shift timetables based on staff availability and preferences. It was developed as part of a **Bachelor's thesis** in computer science, focusing on **AI-driven workforce planning** using [Timefold](https://timefold.ai/) and modern web technologies.

## 📚 Thesis Title

**Employee Scheduler for Hospitals**  
Bachelor's Thesis  
_Supervised by: Vladmir Viies  
_University: TalTech

---

## 🚀 Project Overview

Hospital scheduling is a complex constraint satisfaction problem. This application provides a user-friendly interface for hospital staff to input their **availability and preferences**, and uses **Timefold**, an AI constraint solver, to generate an **optimized shift schedule**.

### Key Features

- Staff can select:
  - ✅ Prefer to work
  - ❌ Cannot work
  - ⚠️ Wouldn't like to work
- Real-time schedule generation with hard and soft constraint logic
- Built with **Next.js**, **TypeScript**, and **Timefold on Quarkus**
- Deployed using **Docker** (via **Render** platform)

---

## 🧠 Technologies Used

| Component        | Technology            |
|------------------|------------------------|
| Frontend         | Next.js, TypeScript    |
| Backend          | Quarkus, Java, Timefold |
| Constraint Solver| Timefold AI Solver     |
| Deployment       | Docker, Render         |
| Database | PostgreSQL  |

---


## ⚙️ How It Works

1. **Staff select their shift preferences** in the user interface:
   - ✅ Prefer to work
   - ❌ Cannot work
   - ⚠️ Wouldn't like to work

2. **Frontend sends the data** to the backend via a REST API.

3. The backend **transforms the input into a Timefold planning problem**, where:
   - **Hard constraints** (e.g., "Cannot work") must always be satisfied.
   - **Soft constraints** (e.g., "Wouldn't like to work") are respected where possible to improve fairness and satisfaction.

4. **Timefold solves the schedule** using AI optimization techniques.

5. **Frontend displays the generated schedule**, allowing hospital administrators to review or export the results.

---

## 📖 Thesis Structure

- **Problem Description**  
  Explains the challenges of manual hospital scheduling and the motivation for an automated solution.

- **Related Work**  
  Overview of classical scheduling methods and modern AI-driven techniques.

- **Implementation**  
  Details the full-stack architecture (frontend, backend, solver), how constraints are modeled, and how the solution is calculated.

- **Optimization Strategies**  
  Discussion of scoring functions, solver configuration, and constraint weights (e.g., hard vs. soft constraints).

- **Evaluation**  
  Benchmarks and testing results comparing the system-generated schedule against manual ones.



---

## ✅ Status

- ✅ Functional prototype complete
- 📚 Bachelor thesis submitted


---

## 👤 Author

**Kirill Morenko**  
📧 kimore@taltech.ee 
🎓 TalTech

