const fs = require('fs');
const path = require('path');

const fixApp = () => {
  const file = path.join(__dirname, 'client/src/app/app.component.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ HlmIcon \} from '@spartan-ng\/helm\/icon';/, "import { HlmIconImports } from '@spartan-ng/helm/icon';");
  content = content.replace(/HlmIcon(?!Imports)/g, 'HlmIconImports');
  fs.writeFileSync(file, content);
};

const fixChat = () => {
  const file = path.join(__dirname, 'client/src/app/pages/chat/chat.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ HlmIcon \} from '@spartan-ng\/helm\/icon';/, "import { HlmIconImports } from '@spartan-ng/helm/icon';");
  content = content.replace(/HlmIcon(?!Imports)/g, 'HlmIconImports');
  fs.writeFileSync(file, content);
};

const fixDashboard = () => {
  const file = path.join(__dirname, 'client/src/app/pages/dashboard/dashboard.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ HlmIcon \} from '@spartan-ng\/helm\/icon';/, "import { HlmIconImports } from '@spartan-ng/helm/icon';");
  content = content.replace(/HlmIcon(?!Imports)/g, 'HlmIconImports');
  fs.writeFileSync(file, content);
};

const fixJobs = () => {
  const file = path.join(__dirname, 'client/src/app/pages/jobs/jobs.ts');
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('FormsModule')) {
    content = content.replace(/ReactiveFormsModule/, 'ReactiveFormsModule, FormsModule');
    content = content.replace(/import \{ FormBuilder/, "import { FormsModule, FormBuilder");
  }
  content = content.replace(/\(ngModelChange\)="updateStatus\(job, \$event\)"/, '(change)="updateStatus(job, $any($event).target.value)"');
  fs.writeFileSync(file, content);
};

fixApp();
fixChat();
fixDashboard();
fixJobs();
console.log('Fixed errors');
