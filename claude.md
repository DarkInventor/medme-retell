AI Tools Engineer Take‑Home Challenge

Why we’re asking you to build this
MedMe helps pharmacies transform into community health hubs by automating routine, high‑impact workflows. Appointment scheduling is one of the most common—and painful—tasks our customers face. This exercise lets us peek into how you tackle a real‑world automation problem end‑to‑end: conversation design, API plumbing, reliability, and user empathy.

2 · What you’ll build (public brief)
Create a conversational agent (chat) able to book and reschedule pharmacy appointments on top of Retell.ai. If you really want to you can use a different provider.
2.1 Must‑haves
Natural‑language flow that collects:
appointment type (you choose e.g. “flu shot” or “consultation”),
preferred date/time,
patient name + phone/email.
Two live integrations
Calendar: Calendly, Google Calendar API, or similar – fetch free slots & create events.
Data store: Google Sheets, Airtable, Supabase, etc. – log each confirmed booking (time, patient, agent notes).
Edge‑case handling
unavailable slot → suggest next best;
missing info → ask follow‑up question;
external API failure → apologise & offer human follow‑up;
user wants to cancel or reschedule → look up booking, act accordingly;
Etc. verify user for unauthorised access, think of extras and delighters etc.

2.2 Voice‑ready build options
We ultimately ship voice agents in production. To simplify this take‑home we suggest:
Build a text‑chat prototype on RetellAI’s chat API that can be swapped to voice with minimal tweaks.
If you really want to you can use a different provider: VAPI, Livekit, etc. 
Please avoid generic chat builders (e.g. Twilio Studio, Dialogflow CX) that lock you into text‑only flows—we want to see something that can graduate to voice instantly.
2.3 Deliverables
Working demo. Chat link. Tested end‑to‑end.
Technical write-up. 1‑2 pages or README covering:
architecture & key components
tools/libraries chosen & why
integration snippets (code or screenshots)
error‑handling approach
"if I had more time…" thoughts.
Welcomed: tips for testing, maybe you made some day busy, etc
GitHub link, screenshots of config in Retell. flowchart, sequence diagram—anything that helps us follow the logic. 
2.4 Tips
Dummy calendar pre‑filled with a handful of busy/free slots is fine—just show real API calls. Make sure not all dates available etc.
Tone matters: a caring, respectful agent beats a robotic script.
Feel free to reuse snippets, SDKs, templates—just credit them.
Stuck or out of RetellAI credits? Ping us early; we’re happy to help.
We don’t expect perfection in 8 hours—show us your judgment, empathy, and engineering craft.
Good luck! We look forward to hearing (or chatting) with your bot.

Use this API key for retell ai 

secret key - key_55cdcd1c37839f5b8e4fd9958827