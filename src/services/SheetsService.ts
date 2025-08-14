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
    private doc: GoogleSpreadsheet | null = null;

    async init(): Promise<void> {
        if (this.doc) return;
        
        try {
            console.log('🔍 Initializing Google Sheets connection...');
            console.log('📊 Spreadsheet ID:', config.googleSheets.spreadsheetId);
            console.log('📋 Sheet name:', config.googleSheets.spreadsheeTabName);

            const jwt = new JWT({
                email: config.googleSheets.serviceAccountEmail,
                key: config.googleSheets.privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.doc = new GoogleSpreadsheet(config.googleSheets.spreadsheetId, jwt);

            await this.doc.loadInfo();
            console.log('✅ Spreadsheet loaded:', this.doc.title);

            // Ensure we have a sheet for user data
            let sheet = this.doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                console.log(`📝 Creating sheet "${config.googleSheets.spreadsheeTabName}"...`);
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
                console.log('✅ Sheet created successfully');
            } else {
                console.log(`✅ Sheet "${config.googleSheets.spreadsheeTabName}" found`);
            }
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets:', error);
            throw error;
        }
    }

    async saveUserData(userData: UserData): Promise<void> {
        if (!this.doc) {
            throw new Error('Google Sheets is not initialized');
        }

        try {
            const sheet = this.doc.sheetsByTitle[config.googleSheets.spreadsheeTabName];
            if (!sheet) {
                throw new Error(
                    `Sheet "${config.googleSheets.spreadsheeTabName}" not found. Available sheets: ${Object.keys(
                        this.doc.sheetsByTitle,
                    ).join(', ')}`,
                );
            }

            console.log('💾 Saving user data:', userData.telegramUsername);

            await sheet.addRow({
                [HEADER_TITLES.appliedAt]: formatTimestamp(userData.timestamp),
                [HEADER_TITLES.telegramUsername]: userData.telegramUsername,
                [HEADER_TITLES.email]: userData.email,
                [HEADER_TITLES.name]: userData.name,
                [HEADER_TITLES.workPosition]: userData.workPosition,
                [HEADER_TITLES.courseId]: userData.courseId,
                [HEADER_TITLES.courseName]: userData.courseName,
            });

            console.log(`✅ User data saved successfully: ${userData.telegramUsername}`);
        } catch (error) {
            console.error('❌ Error saving user data to Google Sheets:', error);
            throw error;
        }
    }
}

export const sheetsService = new SheetsService();
