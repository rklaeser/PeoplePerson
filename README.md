# PeoplePerson

Never forget a conversation. Always remember what matters. Build meaningful relationships at scale.

PeoplePerson is a friend journal and relationship manager. It's a learning project so there is no public website. Video walk through in the works.

![Screenshot 2025-06-05 at 3 25 40 PM](https://github.com/user-attachments/assets/bd91b445-2ac2-4cee-b9db-5446b205601b)

## Why?

"She smiled, she laughed, she waved. Using the reminders and lists she kept in her notebook, she asked after families, new births, and favorite axehounds. She inquired about trade situations, took notes on which lighteyes seemed to be avoiding others. In short, she acted like a queen." - Brandon Sanderson describing Navani Kholin, Rhythm of War

"Become genuinely interested in other people" - Dale Carnegie

# Stack

Built with React and TanStack Router on the frontend, FastAPI backend with Firebase Authentication, and PostgreSQL (Cloud SQL) for data storage. SMS functionality powered by Twilio integration.

## To run

```bash
# Setup database
make db-sync    # Sync database schema
make db-seed    # Seed with initial data

# Start all services in tmux (recommended)
make start-all

# Or start individual services
make sql        # Cloud SQL proxy
make api        # FastAPI backend
make auth       # Firebase Auth emulator
make webclient  # React frontend
make twilio     # Twilio dev phone for SMS testing
```
