# Odoo Installation Instructions

These instructions are for installing Odoo on a Linux system. You may need to adapt these instructions to your specific operating system.

1.  **Install dependencies:** Odoo has several dependencies that need to be installed. These dependencies can be installed using the following command:

    ```bash
    sudo apt-get update
    sudo apt-get install -y postgresql python3-pip git
    ```

2.  **Install Odoo:** Odoo can be installed from source using Git. The following commands will download the Odoo source code and install it:

    ```bash
    git clone https://www.github.com/odoo/odoo --depth 1 --branch 16.0 /opt/odoo
    sudo pip3 install -r /opt/odoo/requirements.txt
    ```

3.  **Create a user account:** Odoo needs a user account to run. The following command will create a user account called `odoo`:

    ```bash
    sudo adduser --system --home=/opt/odoo --group odoo
    ```

4.  **Create a configuration file:** Odoo needs a configuration file to run. The following command will create a configuration file called `/etc/odoo.conf`:

    ```bash
    sudo nano /etc/odoo.conf
    ```

    The configuration file should contain the following:

    ```
    [options]
    admin_passwd = admin
    db_host = localhost
    db_port = 5432
    db_user = odoo
    db_password = odoo
    logfile = /var/log/odoo.log
    addons_path = /opt/odoo/addons
    ```

5.  **Create a systemd service file:** Odoo needs a systemd service file to run. The following command will create a systemd service file called `/etc/systemd/system/odoo.service`:

    ```bash
    sudo nano /etc/systemd/system/odoo.service
    ```

    The systemd service file should contain the following:

    ```
    [Unit]
    Description=Odoo
    Requires=postgresql.service
    After=network.target postgresql.service

    [Service]
    Type=simple
    User=odoo
    Group=odoo
    WorkingDirectory=/opt/odoo
    ExecStart=/opt/odoo/odoo-bin -c /etc/odoo.conf
    Restart=always
    KillMode=mixed
    TimeoutSec=300

    [Install]
    WantedBy=multi-user.target
    ```

6.  **Start Odoo:** Odoo can be started using the following commands:

    ```bash
    sudo systemctl enable odoo.service
    sudo systemctl start odoo.service
