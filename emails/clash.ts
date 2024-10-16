import { EmailData } from "@/lib/types";

export function getClashEmailContent(params: EmailData["params"]): string {
    return `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            strong {
              font-family: "Century Gothic", sans-serif;
            }
          </style>
        </head>
        <body>
		    ${params?.Date ? `<p style="margin: 0;"><strong>Date: </strong>${params.Date}</p>` : ""}
		    ${params?.Venue ? `<p style="margin: 0;"><strong>Venue: </strong>${params.Venue}</p>` : ""}
		    ${
                params?.TitleOfShow
                    ? `<p style="margin: 0;"><strong>Show Title: </strong>${params.TitleOfShow}</p>`
                    : ""
            }
            </br>
		    <p style="margin: 0;">You are receiving this email because you also have a First Night Diary booking on that date.</p>
		    <p style="margin: 0;">Full clash details are attached as a CSV file, with press contacts included.</p>
            <p style="margin: 0;">You can see the full diary here <a href="https://solt.co.uk/first-night-diary">SOLT First Night Diary</a> and you can edit or delete your entry on the diary itself.</p>
            </br>
		    <p style="margin: 0;">If you have any questions, please contact Jen: <a href="mailto:Jen.dicksonpurdy@soltukt.co.uk?subject=First%20Night%20Diary%20query">Jen.dicksonpurdy@soltukt.co.uk</a></p>
		    <br/>
		    <p style="margin: 0;">Best wishes,</p>
		    <p style="margin: 0;">SOLT & UK Theatre</p>
		</body>
      </html>
    `;
}

function renderShowCategory(params: EmailData["params"]): string {
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
    return "";
}
