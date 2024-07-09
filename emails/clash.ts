import { EmailData } from '@/lib/types';

export function getClashEmailContent(params: EmailData['params']): string {
	return `
    <html>
      <body>
        <h1>Welcome, ${params?.name || 'Valued Customer'}!</h1>
        <p>We're excited to have you on board.</p>
        <p>Your account details:</p>
        <ul>
          <li>Username: ${params?.username || 'N/A'}</li>
          <li>Email: ${params?.email || 'N/A'}</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
      </body>
    </html>
  `;
}