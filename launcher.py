from odoo import models, fields, api
import subprocess
import logging

class ParachuteLauncher(models.Model):
    _name = "parachute.launcher"
    _description = "3D Pipeline Launcher"

    name = fields.Char("Job Name", required=True)
    video_url = fields.Char("YouTube URL", default="https://www.youtube.com/watch?v=XbfNWbMvSXk")
    start_time = fields.Char("Start Time", default="00:00:19")
    duration = fields.Integer("Duration (s)", default=5)
    status = fields.Selection([
        ('idle', 'Idle'),
        ('running', 'Running'),
        ('done', 'Done'),
        ('failed', 'Failed')
    ], default='idle')
    audit_log = fields.Text("Log Output", readonly=True)
    export_path = fields.Char("Exported File", readonly=True)

    def run_pipeline(self):
        self.status = 'running'
        self.audit_log = "Launching pipeline...\n"
        try:
            subprocess.run(["/usr/local/bin/parachute_3d_pipeline.py"], check=True)
            self.status = 'done'
            self.export_path = str((Path.home() / "3d_exports").absolute())
        except Exception as e:
            self.status = 'failed'
            self.audit_log += str(e)
        return True
