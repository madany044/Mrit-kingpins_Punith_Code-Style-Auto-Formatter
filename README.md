# FixBudz – AI-Powered Code Linter & Auto-Formatter

<div align="center">

![FixBudz Banner](https://via.placeholder.com/800x200/2c3e50/ffffff?text=FixBudz+AI+Code+Formatter)

**A professional VS Code-style debugging workspace that uses advanced AI to detect, fix, and enhance code quality in real-time.**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/madany044/Mrit-kingpins_Punith_Code-Style-Auto-Formatter)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
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


