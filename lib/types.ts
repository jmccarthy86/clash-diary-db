export type RequestData = {
	Year: string,
	Range: string,
	//Dates: Record<string, Record<string, Record<string, any>>>
	Dates: Record<string, { range: string, bookings: Record<string, string>[] }>
}

export type SubRow = Record<string, string | number>;

export type Booking = {
	date: string;
	subRows: SubRow[];
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