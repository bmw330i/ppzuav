# Paparazzi Reference Code

**⚠️ IMPORTANT: This directory contains the original Paparazzi UAV project GPL-licensed code**

## Purpose

This directory contains the original Paparazzi UAV system code that is licensed under GPL v2+. This code is provided **for reference only** and is not part of the new PaparazziAI system.

## Contents

- `sw/` - Original airborne C code and firmware
- `conf/` - Original configuration files and airframe definitions
- `doc/` - Original documentation and Doxygen files
- `data/` - Original data files and maps
- `examples/` - Original example configurations
- `tests/` - Original test suites
- `debian/` - Original Debian packaging files
- Build files (`Makefile*`, `Doxyfile`, etc.)

## Licensing

All code in this directory is licensed under **GPL v2+** as per the original Paparazzi project. See the main Paparazzi project repository for license details.

## Usage

This code is provided solely for:
- Research and reference purposes
- Understanding the original Paparazzi architecture
- Compatibility testing with existing hardware

**Do not use this code in production or distribute it as part of the PaparazziAI system.**

## Relationship to PaparazziAI

The PaparazziAI system (in the parent directory) is a complete modernization that:
- Eliminates OCaml dependencies
- Provides modern Node.js/TypeScript architecture
- Includes AI pilot capabilities
- Is independently licensed and developed

This reference code helps the AI understand the original system but is not integrated into the new codebase.