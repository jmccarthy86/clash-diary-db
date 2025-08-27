import { EmailData } from '@/lib/types';

export async function sendEmail(emailData: EmailData): Promise<boolean> {
	try {
		const response = await fetch('/api/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(emailData),
		});

		const result = await response.json();
		if (!result.success) {
			console.error('Failed to send email:', result.error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error sending email:', error);
		return false;
	}
}