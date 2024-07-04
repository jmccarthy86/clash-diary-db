export type RequestData = {
    Year: number,
	Range: string,
	Dates: Record<string, Record<string, Record<string, any>>>
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
};