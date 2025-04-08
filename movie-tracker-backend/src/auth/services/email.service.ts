// src/auth/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // In production, you should use a proper email service provider like SendGrid, Mailgun, etc.
    // For development/testing, we can use a test (ethereal) account or local setup
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const useTestAccount = this.configService.get('EMAIL_USE_TEST_ACCOUNT', 'true') === 'true';
    
    if (useTestAccount) {
      // Create a test account on Ethereal for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      this.logger.log(`Test email account created at ${testAccount.web}`);
    } else {
      // Use configured email provider
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST'),
        port: this.configService.get('EMAIL_PORT', 587),
        secure: this.configService.get('EMAIL_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASSWORD'),
        },
      });
    }
  }

  /**
   * Send an email verification link to a user
   * @param to Recipient email address
   * @param verificationLink The verification link
   * @returns Information about the email delivery
   */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<any> {
    try {
      const appName = this.configService.get('APP_NAME', 'CineTrack');
      const mailOptions = {
        from: `"${appName}" <${this.configService.get('EMAIL_FROM', 'noreply@example.com')}>`,
        to,
        subject: `Verify Your Email for ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email</h2>
            <p>Thank you for signing up! Please click the link below to verify your email address:</p>
            <p>
              <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                Verify Email
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>${verificationLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${to}: ${info.messageId}`);
      
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.debug(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return info;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a password reset link to a user
   * @param to Recipient email address
   * @param resetLink The password reset link
   * @returns Information about the email delivery
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<any> {
    try {
      const appName = this.configService.get('APP_NAME', 'CineTrack');
      const mailOptions = {
        from: `"${appName}" <${this.configService.get('EMAIL_FROM', 'noreply@example.com')}>`,
        to,
        subject: `Reset Your Password for ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}: ${info.messageId}`);
      
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.debug(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return info;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}