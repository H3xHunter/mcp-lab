# TODO - Assignment Requirements

## Assignment Completion Checklist

Based on the original laboratory assignment "Laboratorio MCP":

### Core Requirements

- [ ] Two functional APIs created using MCP
  - [ ] API 1: Ventas (Sales) - Node.js/TypeScript
  - [ ] API 2: Pedidos (Orders) - Python
- [ ] MCP Gateway connects both APIs
- [ ] Connected to Claude Desktop application
- [ ] Gateway routes requests by prefix (ventas_*, pedidos_*)

### Testing & Documentation

- [ ] Test connection between APIs and Claude Desktop
- [ ] Document process in report with:
  - [ ] Introduction to APIs and their purposes
  - [ ] Step-by-step creation and connection description
  - [ ] Challenges faced and solutions
  - [ ] Screenshots or code snippets
- [ ] Take screenshot of Claude Desktop → Settings → Developer → Local MCP servers showing gateway "connected"
- [ ] Capture successful tool calls in chat
- [ ] Save call traces/logs

### Database

- [ ] PostgreSQL setup complete
- [ ] Schema and seed data loaded
- [ ] Verify 90+ days of sales data
- [ ] Verify 30+ orders with varied statuses

### Endpoints Verification

- [ ] `ventas_total_mes_anterior` - Returns previous month total
- [ ] `ventas_por_dia?n=30` - Returns daily sales series
- [ ] `pedidos_estado_por_id?id=X` - Returns order status
- [ ] `pedidos_crear?cliente=X&monto=Y` - Creates order, returns ID

### Final Checks

- [ ] All services start in correct order
- [ ] Gateway shows as "connected" in Claude Desktop
- [ ] All four tools visible in Claude
- [ ] Test each tool with sample queries
- [ ] Collect evidence (screenshots + logs)

## Notes

- This is a laboratory assignment, not a production system
- Focus on functionality over production-readiness
- No need for authentication, rate limiting, or advanced security features
