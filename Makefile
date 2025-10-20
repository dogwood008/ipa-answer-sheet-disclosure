PORT ?= 8001
DIST_DIR := apps/002-poc/dist

.PHONY: serve
serve:
	@echo "Serving $(DIST_DIR) at http://localhost:$(PORT)"
	cd $(DIST_DIR) && python3 -m http.server $(PORT)

