Project Voice - P2P Communication Application
==============================================

Welcome to Project Voice! This is a peer-to-peer communication application that allows two users to connect directly without any server or registration required.

PREREQUISITES:
- You must have Node.js and npm installed on your computer
- If you don't have them installed, download Node.js from https://nodejs.org/

HOW TO RUN THE APPLICATION:
1. Double-click on "run_project_voice.bat" file
2. The application will automatically install dependencies if needed
3. The application window will open

HOW TO USE THE APPLICATION:

For the HOST (person creating the session):
1. Click on "Become Host" button
2. Click on "Start Hosting" button
3. An invitation link will be generated
4. Click "Copy" to copy the link to your clipboard
5. Send this link to the person you want to connect with
6. Wait for the guest to connect

For the GUEST (person joining the session):
1. Click on "Connect as Guest" button
2. Paste the invitation link in the input field
3. Click on "Connect" button
4. Wait for the connection to be established

ONCE CONNECTED:
- You can send text messages to each other in real-time
- The connection is peer-to-peer and encrypted
- The token in the link expires after 10 minutes for security

TROUBLESHOOTING:
- If the application fails to start, make sure Node.js is installed
- If connections fail, both users might be behind strict firewalls or NAT
- Make sure both users have a stable internet connection

SECURITY NOTES:
- The application uses end-to-end encryption
- Connection tokens expire automatically
- No data is stored on any server
- The application works directly between your computers