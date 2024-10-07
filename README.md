# Histori Backend Auto Updater

Brief description of your project. Explain what it does and why it is useful.

## Prerequisites

- Node.js (v16 or later)
- npm
- Git
- Any other tools or frameworks used in the project

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Esscrypt/histori-backend-auto-updater.git
    ```

2. Navigate to the project directory:
    ```bash
    cd histori-backend-auto-updater
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

4. Create a `.env` file in the root directory and add the necessary environment variables. For example:
    ```env
    GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
    ```

## Usage

### Running the Application

To start the application, run:
```bash
# firstly create a systemctl file
sudo systemctl restart webhook-listener.service
journalctl -u webhook-listener -f
```
