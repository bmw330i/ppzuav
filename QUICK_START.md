# Quick Start Guide for PaparazziAI Development

## New Workspace Setup

Welcome to the **PaparazziAI** workspace! This is your clean, GPL-free AI UAV operations system.

### 🚀 **Immediate Setup**

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Test Core System**
   ```bash
   # Test aircraft design
   python3 aircraft_builder/aircraft_builder.py
   
   # Test flight planning
   python3 aircraft_builder/ai_pilot.py
   
   # Test complete operations
   python3 aircraft_builder/complete_ai_pilot_system.py
   ```

3. **Start Development Environment**
   ```bash
   # Start all services
   npm run services:start
   
   # Open Ground Control Station
   open http://localhost:3000
   ```

### 📋 **Current Status**

**Project**: Complete AI pilot system for autonomous UAV operations  
**Repository**: `https://github.com/bmw330i/ppzuav.git` (Private)  
**Date**: October 26, 2025  
**Phase**: Secure development, GPL-free codebase

### ✅ **What's Complete**
- ✅ AI Pilot system with FAA-compliant operations
- ✅ Aircraft Builder for automated UAV design
- ✅ Hardware database with COTS components
- ✅ Real-time GCS with interactive mapping
- ✅ ADS-B integration for traffic monitoring
- ✅ Modern Node.js/TypeScript architecture
- ✅ Code separation from GPL Paparazzi project
- ✅ Private repository for IP protection

### 🔧 **Next Priority: Launch Detection**

**Remaining Todo**: Implement IMU-based launch detection and mission automation

**What to build**:
1. IMU-based launch detection algorithm
2. Automatic mission execution triggers
3. Human guidance system for flight preparation checklist
4. Integration with existing AI pilot system

### 🗂️ **Key Files to Understand**

**Read These First**:
- `DEVELOPMENT_CONTEXT.md` - Complete conversation history
- `AI_ASSISTANT_INSTRUCTIONS.md` - Instructions for AI development
- `README.md` - System overview and architecture
- `prompts/ai_pilot_system.txt` - AI pilot knowledge base

**Core Components**:
- `aircraft_builder/` - AI pilot Python system
- `src/gcs/` - React Ground Control Station
- `hardware_config/` - Component specifications
- `scripts/` - Service management tools

### 🛡️ **Security Reminders**

- **Private Repository**: Keep this code private for now
- **GPL-Free**: No original Paparazzi code in this workspace
- **Independent License**: Custom licensing, not GPL
- **Safety First**: All code must maintain aviation safety standards

### 🔄 **Development Workflow**

```bash
# Make changes
git add .
git commit -m "Your meaningful commit message"
git push origin master

# Test changes
npm test                               # Run test suite
python3 aircraft_builder/ai_pilot.py  # Test AI pilot
npm run services:restart              # Restart services

# Monitor system
npm run logs:tail                      # Live log monitoring
npm run services:status               # Check service health
```

### 🎯 **Immediate Action Items**

1. **Validate Environment**: Run the test commands above
2. **Review Documentation**: Read key files listed above
3. **Implement Launch Detection**: Begin the remaining todo
4. **System Integration**: Ensure new features work with existing code

### 📞 **Getting Help**

If you need context about:
- **Recent Work**: Check `DEVELOPMENT_CONTEXT.md`
- **System Architecture**: Read `ARCHITECTURE.md`
- **AI Pilot Guidelines**: See `prompts/ai_pilot_system.txt`
- **Component Specs**: Review `hardware_config/*.json`

---

**Ready to Continue Development!** 🚁🤖

Your PaparazziAI system is clean, secure, and ready for the final implementation phase.