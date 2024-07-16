import { EmailData } from '@/lib/types';

export function getClashEmailContent(params: EmailData['params']): string {
	return `
	  <html>
		<body>
		  <p>Hello,</p>
		  <p>A new clash has been added to the First Night Diary:</p>
		  ${params?.Date ? `<p><strong>Date: </strong>${params.Date}</p>` : ''}
		  ${params?.Venue ? `<p><strong>Venue: </strong>${params.Venue}</p>` : ''}
		  ${params?.TitleOfShow ? `<p><strong>Show Title: </strong>${params.TitleOfShow}</p>` : ''}
		  ${params?.MemberLevel && params.MemberLevel.trim() !== '' ? `<p><strong>Member Level: </strong>${params.MemberLevel}</p>` : ''}
		  ${renderShowCategory(params)}
		  <p>You are receiving this email because you also have a First Night Diary booking on that date.</p>
		  <p>You can see the full diary here [link to diary] and you can edit or delete your entry on the diary itself.</p>
		  <p>If you have any questions, please contact Jen <a href="mailto:Jen.dicksonpurdy@soltukt.co.uk?subject=First%20Night%20Diary%20query">Jen.dicksonpurdy@soltukt.co.uk</a></p>
		  <br/>
		  <p>Best wishes,</p>
		  <p>Jen Dickson-Purdy</p>
		  <p>Marketing Coordinator</p>
		  <p>SOLT & UK Theatre</p>
		</body>
	  </html>
	`;
}

function renderShowCategory(params: EmailData['params']): string {
	if (params?.IsOperaDance !== undefined || params?.IsSeasonGala !== undefined) {
		let categories = [];
		if (params.IsOperaDance) {
			categories.push("Opera/Dance");
		}
		if (params.IsSeasonGala) {
			categories.push("Season Announcement or Gala Night");
		}
		if (categories.length > 0) {
			return `<p><strong>Show Category: </strong>${categories.join(", ")}</p>`;
		}
	}
	return '';
}