#!/bin/bash
# Aliases pour Claude Code - Café Coworking Project

# Agents shortcuts
alias claude-pm='claude "[ROLE: PM_Agent]'
alias claude-arch='claude "[ROLE: Architect_Agent]'
alias claude-back='claude "[ROLE: Backend_Agent]'
alias claude-front='claude "[ROLE: Frontend_Agent]'
alias claude-ui='claude "[ROLE: UI_Agent]'
alias claude-ux='claude "[ROLE: UX_Agent]'
alias claude-db='claude "[ROLE: DB_Agent]'
alias claude-sec='claude "[ROLE: Security_Agent]'
alias claude-qa='claude "[ROLE: QA_Agent]'
alias claude-ops='claude "[ROLE: DevOps_Agent]'

# Commandes fréquentes
alias claude-standup='claude "[ROLE: PM_Agent] [TASK: Générer le daily standup du jour]"'
alias claude-review='claude "[ROLE: Senior_Developer] [TASK: Code review pour'
alias claude-test='claude "[ROLE: QA_Agent] [TASK: Écrire les tests pour'
alias claude-deploy='claude "[ROLE: DevOps_Agent] [TASK: Préparer le déploiement de'

# Commandes de sprint
alias claude-sprint-start='claude "[ROLE: PM_Agent] [TASK: Initialiser le sprint avec objectifs et user stories]"'
alias claude-sprint-end='claude "[ROLE: PM_Agent] [TASK: Générer le rapport de fin de sprint avec métriques]"'

# Urgences
alias claude-bug='claude "[ROLE: Debug_Expert] [URGENCY: HIGH] [BUG:'
alias claude-hotfix='claude "[ROLE: Senior_Developer] [URGENCY: CRITICAL] [TASK:'

# Multi-agents
alias claude-feature='claude "[TEAM: Architect_Agent, Backend_Agent, Frontend_Agent, QA_Agent] [FEATURE:'

# Aide rapide
alias claude-help='claude "Liste tous les agents disponibles avec leurs spécialités"'
alias claude-status='claude "[ROLE: PM_Agent] [TASK: Status actuel du projet et prochaines priorités]"'

echo "🚀 Claude Code aliases loaded for Coworking Platform"