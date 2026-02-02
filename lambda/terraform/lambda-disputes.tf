# Disputes Module Lambda Functions
# Complete dispute management system with 11 handlers
# NOTE: These functions are disabled until zip files are built

# Uncomment and use when zip files are available:
# locals {
#   disputes_zip_exists = {
#     create         = fileexists("${path.module}/../dist/disputes-create.zip")
#     get_list       = fileexists("${path.module}/../dist/disputes-get-list.zip")
#     ...
#   }
# }

# All dispute Lambda functions are commented out until the build process
# creates the necessary zip files. Run `npm run build` and the packaging
# script to generate these files.

# Placeholder for future dispute Lambda functions:
# - create_dispute
# - get_disputes
# - get_dispute
# - update_dispute_status
# - close_dispute
# - escalate_dispute
# - request_mediation
# - get_dispute_messages
# - send_dispute_message
# - add_evidence
# - accept_resolution
