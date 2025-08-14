import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { config } from '../config';
import { JWT } from 'google-auth-library';
import { formatTimestamp } from '@/utils/formatDates';

export interface UserData {
    telegramUsername: string;
    email: string;
    name: string;
    workPosition: string;
    courseId: number;
    courseName: string;
    timestamp: string;
}

const HEADER_TITLES = {
    appliedAt: 'Applied At',
    telegramUsername: 'tg @username',
    email: 'Email',
    name: 'Name',
    workPosition: 'Work Position',
    courseId: 'Course Id',
    courseName: 'Course Name',
};

export class SheetsService {
    private doc: GoogleSpreadsheet;

    constructor() {
        const jwt = new JWT({
            email: config.googleSheets.serviceAccountEmail,
            key: config.googleSheets.privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        this.doc = new GoogleSpreadsheet(config.googleSheets.spreadsheetId, jwt);

        this.init();
    }

    async init() {
        if (this.doc) {
            await this.doc.loadInfo();

            // Ensure we have a sheet for user data
            let sheet = this.doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                sheet = await this.doc.addSheet({
                    title: config.googleSheets.spreadsheeTabName,
                    headerValues: [
                        HEADER_TITLES.appliedAt,
                        HEADER_TITLES.telegramUsername,
                        HEADER_TITLES.email,
                        HEADER_TITLES.name,
                        HEADER_TITLES.workPosition,
                        HEADER_TITLES.courseId,
                        HEADER_TITLES.courseName,
                    ],
                });
            }
        }
    }

    async saveUserData(userData: UserData): Promise<void> {
        try {
            const sheet = this.doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                throw new Error('Sheet not found');
            }
            console.log('userData: ', userData);
            await sheet.addRow({
                [HEADER_TITLES.appliedAt]: formatTimestamp(userData.timestamp),
                [HEADER_TITLES.telegramUsername]: userData.telegramUsername,
                [HEADER_TITLES.email]: userData.email,
                [HEADER_TITLES.name]: userData.name,
                [HEADER_TITLES.workPosition]: userData.workPosition,
                [HEADER_TITLES.courseId]: userData.courseId,
                [HEADER_TITLES.courseName]: userData.courseName,
            });

            console.log(`User data saved to Google Sheets successfully: ${userData.telegramUsername}`);
        } catch (error) {
            console.error('Error saving user data to Google Sheets:', error);
            throw error;
        }
    }
}

export const sheetsService = new SheetsService();
