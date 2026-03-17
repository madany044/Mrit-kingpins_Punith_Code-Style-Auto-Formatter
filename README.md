#       The AI-Powered Code Linter & Auto-Formatter

<div align="center">

**A professional debugging workspace that uses advanced AI to detect, fix, and enhance code quality in real-time.**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/madany044/Mrit-kingpins_Punith_Code-Style-Auto-Formatter)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?logo=python)](https://python.org)
[![AI Powered](https://img.shields.io/badge/AI-Powered-orange?logo=ai)](https://huggingface.co)

*Intelligent code formatting meets professional developer experience*

</div>

## 🚀 Overview

FixBudz is a modern, AI-powered code assistant built to enhance code quality, detect errors, fix formatting issues, and improve overall structure. It combines an intelligent code-fixing model with a VS Code-style browser workspace, complete with a file explorer, editor, suggestions panel, and live preview that opens in a new tab.

With integrated machine learning (fine-tuned CodeT5-Small) and a custom linter engine, FixBudz provides clean, contextual fixes and real-time feedback for developers.

**Supported Languages:** HTML, CSS, JavaScript, Python

## Key Features

### 🧠 AI-Powered Code Intelligence
- **Advanced Error Detection**: Identifies syntax errors, formatting issues, broken tags, and structural problems
- **Smart Auto-Correction**: Applies context-aware fixes using fine-tuned CodeT5-Small model
- **Pattern Recognition**: Learns from 7,000+ code samples to provide intelligent suggestions

### 💻 Professional Workspace
- **VS Code-Style Interface**: Familiar editor with file explorer, breadcrumb navigation, and sidebar actions
- **Multi-Panel Layout**: Simultaneous code editing, suggestion viewing, and real-time debugging
- **File Management**: Comprehensive file handling with upload, create, and recent files support

### 🔍 Advanced Preview System
- **Real-time Rendering**: Instant HTML/CSS/JS preview in dedicated tabs
- **Interactive Comparison**: Draggable divider for precise UI analysis

### 🛡️ Enterprise Security
- **Secure Authentication**: Firebase Auth with JWT token management
- **Push Protection**: GitHub secret scanning integration
- **Session Management**: Secure login/logout with status monitoring

## 🏗️ Architecture & Tech Stack

### Frontend Layer
- **Core Technologies**: HTML5, CSS3, JavaScript
- **Editor Engine**: Monaco Editor
- **Real-time Features**: Dynamic file explorer, live preview manager

### Backend Services
- **API Framework**: Python Flask RESTful API
- **AI Engine**: CodeT5-Small fine-tuned on 7,000+ code samples
- **Processing**: Advanced linting with rule-based and ML-powered analysis

### Data & Authentication
- **Authentication**: Firebase Authentication
- **Storage**: Firestore for user metadata and session management
- **Security**: JWT tokens with secure API endpoints

## 📊 AI Training Dataset

Our model is trained on a comprehensive dataset of 7,000+ code pairs covering:

- **Simple Bugs**: Missing semicolons, typos, basic syntax errors
- **Moderate Issues**: Incorrect formatting, spacing problems, attribute errors
- **Complex Problems**: Nested structure errors, CSS specificity issues
- **Advanced Repairs**: HTML semantic corrections, responsive design fixes

**Dataset Format:**
```json
{
  "input_html": "<div><h2>Missing Closing Tag</h2>",
  "input_css": "padding: 12px color: red margin: 0",
  "upgraded_html": "<div><h2>Missing Closing Tag</h2></div>",
  "upgraded_css": "padding: 12px; color: red; margin: 0;"
}

```

## 🔧 How It Works

### **1. Code Input & Analysis**
```javascript
// User writes or uploads code
const userCode = '
function example() {
  console.log("Hello World")
}';

// FixBudz analyzes using AI + rule engine
const analysis = await analyzeCode(userCode);
```

## 2. Intelligent Suggestions

- **AI-Powered Fixes:** Context-aware corrections & formatting

- **Rule-Based Recommendations:** ESLint-style static analysis

- **Confidence Scoring:** Every suggestion includes model certainty

## 3. Interactive Preview

- **Split Comparison:** Original vs. Fixed output

- **Live Rendering:** Instant preview opens in a new browser tab

- **Clean UI:** Distraction-free , Good UI

## 4. Apply Actions

- One-Click Apply Fix

- Selective Acceptance (per-line / full file)

- **Version Control-Ready:** Safe tracking + revert support

## 🚀 Quick Start
- Prerequisites

- Python 3.8+

- Modern web browser

- Git installed

## Installation & Setup
### Clone the repository
```
git clone https://github.com/madany044/Mrit-kingpins_Punith_Code-Style-Auto-Formatter.git
cd Mrit-kingpins_Punith_Code-Style-Auto-Formatter
```
### Install backend dependencies
```
pip install -r requirements.txt
```

### Start the backend server
```
python app.py
```

### Open frontend
```
open dashboard.html   # or run with Live Server
```

## Configuration
### Backend Environment
```
export FLASK_ENV=development
export API_PORT=5000
```
## Frontend

- Just open dashboard.html
- No build tools required.

## 🎯 Use Cases

### 🎓 Educational Institutions
- **Instant feedback for students**
- **Automated assignment quality checking**
- **Interactive debugging & learning tool**

### 💼 Enterprise Teams
- **Automated pre-PR code cleanup**
- **Enforce consistent coding standards**
- **Refactor & modernize legacy code**

### 🚀 Individual Developers
- **Rapid HTML/CSS/JS prototyping**
- **Improve code quality with AI guidance**
- **Debug faster using AI-powered fixes**

### 🏆 Hackathons & Competitions
- **Fast iteration with real-time feedback**
- **Maintain clean, production-ready code**
- **Easier collaboration & understanding**


## 👥 Team & Contributors

<div align="center">

### 🏆 Team KingPins – Hackathon Build

| Role | Contributor | Focus Area |
|------|-------------|------------|
| Lead Developer | Dhanush | AI Integration & Backend |
| Frontend Architect | Madan Y | UI/UX & Workspace System |
| AI Engineer | Likhith Gowda | Model Training & Optimization |
| QA Engineer | Akash H M | Testing & Validation |

</div>

## 📊 Performance Metrics

- **Analysis Speed**: < 2 sec
- **Suggestion Accuracy**: ~88%
- **Preview Rendering**: Instant (new-tab live)
- **Model Training**: 7,000+ curated code-fix pairs

## 🤝 Contributing

```bash
# Fork and clone the repo
git clone https://github.com/your-username/Mrit-kingpins_Punith_Code-Style-Auto-Formatter.git

# Create feature branch
git checkout -b feature/amazing-improvement

# Push & submit PR
```

## 🔗 Links & Contact

- **GitHub**: [Code_Style_AutoFormatter](https://github.com/madany044/Code_Style_AutoFormatter)
- **Issues**: [GitHub Issue Tracker](https://github.com/madany044/Mrit-kingpins_Punith_Code-Style-Auto-Formatter/issues)
- **Documentation**: [Wiki](https://github.com/madany044/Mrit-kingpins_Punith_Code-Style-Auto-Formatter/wiki)

### 📧 Contact Information
For queries and support, please contact:
- **Email**: madanmadany2004@gmail.com , akash665017@gmail.com
- **Phone**: +91-9353240289

<div align="center">

**Kingpins Debugger – Mastering The Code**

*Built with ❤️ by Team KingPins*

</div>
