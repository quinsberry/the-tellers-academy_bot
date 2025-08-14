import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { config } from '../config';
import { JWT } from 'google-auth-library';

export interface UserData {
    telegramUsername: string;
    email: string;
    name: string;
    workPosition: string;
    courseId: number;
    courseName: string;
    timestamp: string;
}

export class SheetsService {
    private static doc: GoogleSpreadsheet | null = null;

    static async initializeSheet(): Promise<GoogleSpreadsheet> {
        if (!this.doc) {
            const jwt = new JWT({
                email: config.googleSheets.serviceAccountEmail,
                key: config.googleSheets.privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.doc = new GoogleSpreadsheet(config.googleSheets.spreadsheetId, jwt);

            await this.doc.loadInfo();

            // Ensure we have a sheet for user data
            let sheet = this.doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                sheet = await this.doc.addSheet({
                    title: config.googleSheets.spreadsheeTabName,
                    headerValues: [
                        'Applied At',
                        'Telegram Username',
                        'Email',
                        'Name',
                        'Work Position',
                        'Course ID',
                        'Course Name',
                    ],
                });
            }
        }

        return this.doc;
    }

    static async saveUserData(userData: UserData): Promise<void> {
        try {
            const doc = await this.initializeSheet();
            const sheet = doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                throw new Error('Sheet not found');
            }
            await sheet.addRow({
                Timestamp: userData.timestamp,
                'Telegram Username': userData.telegramUsername,
                Email: userData.email,
                Name: userData.name,
                'Work Position': userData.workPosition,
                'Course ID': userData.courseId,
                'Course Name': userData.courseName,
            });

            console.log('User data saved to Google Sheets successfully');
        } catch (error) {
            console.error('Error saving user data to Google Sheets:', error);
            throw error;
        }
    }
}
