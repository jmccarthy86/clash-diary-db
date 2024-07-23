// export type RequestData = {
// 	Year: string,
// 	Range: string,
// 	Dates: Record<string, { range: string, bookings: Record<string, string>[] }>
// }

// Updated RequestData type
export type RequestData = {
	Year: string;
	Range: string;
	Dates: {
		[date: string]: {
			[range: string]: {
				[key: string]: string | number | boolean | null;
			};
		};
	};
};

//export type SubRow = Record<string, string | number>;

export type Booking = {
	date: string;
	subRows: SubRowData[]
};

export type SubRowData = {
	Date: string;
	range: string;
	TitleOfShow: string;
	Venue: string;
	PressContact: string;
	IsOperaDance: boolean;
	IsSeasonGala: boolean;
	OtherVenue: string;
	P: boolean;
	UserId: string;
	[key: string]: string | number | boolean | null;  // Allow for additional properties
};

export interface EmailRecipient {
	email: string;
	name: string;
}

export interface EmailSender {
	name: string;
	email: string;
}

export interface EmailData {
	to: EmailRecipient[];
	subject: string;
	templateName: string;
	sender: EmailSender;
	replyTo?: EmailSender;
	params?: Record<string, string>;
}