# 🚀 FAM Bakery - Quick Reference

## 🌐 URLs
- **Admin UI**: http://localhost:3000 ⭐
- **API Docs**: http://localhost:8000/docs
- **DB Admin**: http://localhost:8080

## 🎮 Common Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# View logs
docker compose logs -f admin_ui
docker compose logs -f orders_api

# Restart
docker compose restart

# Rebuild after code changes
docker compose build admin_ui
docker compose up -d admin_ui
```

## 📊 Default Data

**Customers**: Alice, Bob
**Products**: Sourdough (€4.50), Croissant (€1.50)
**Orders**: 1 order (Alice, €18.00)

## 🔑 Database Login (Adminer)

- Server: `db`
- Username: `fam_user`
- Password: `changeme`
- Database: `fam_db`

## 📞 Ports

- 3000: React Admin UI
- 8000: FastAPI
- 8080: Adminer
- 5432: PostgreSQL
- 6379: Redis

## 🎯 Order Status Flow

Pendente → Confirmado → Em Preparação → Expedido → Entregue

## 🆘 Quick Troubleshooting

**UI not loading?**
```bash
docker compose logs admin_ui
docker compose restart admin_ui
```

**API errors?**
```bash
curl http://localhost:8000/health
docker compose logs orders_api
```

**Database issues?**
```bash
docker compose exec db psql -U fam_user -d fam_db
SELECT COUNT(*) FROM orders;
```

---

**📖 Full docs**: See `DEPLOYMENT_SUCCESS.md`
