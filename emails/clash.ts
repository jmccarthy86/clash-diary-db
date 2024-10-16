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
		    ${
                params?.TitleOfShow
                    ? `<p style="margin: 0;"><strong>Show Title: </strong>${params.TitleOfShow}</p>`
                    : ""
            }
            </br>
		    <p style="margin: 0;">You are receiving this email because you have a booking in the SOLT & UK Theatre First Night Diary on the above date.</p>
		    <p style="margin: 0;">Full clash details are attached as a spreadsheet (CSV file), with press contacts included. If information in the spreadsheet shows as ######, please expand that column and full details will appear.</p>
            <p style="margin: 0;">Follow this link to see the full diary: <a href="https://solt.co.uk/first-night-diary?selectedDate=${params?.RawDate}">SOLT First Night Diary</a>. You can also edit or delete your entry on the diary itself.</p>
            <p style="margin: 0;">See a full User Guide for the diary here: <a href="https://res.cloudinary.com/solt/image/upload/v1727697464/SOLT_First_Night_Diary_User_Guide_yejiqw.pdf">First Night Diary User Guide</a>
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
