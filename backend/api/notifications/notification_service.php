<?php
/**
 * AUTOMALL - Notification System
 * 
 * Email & SMS notifications for:
 * - Appointment confirmations
 * - OTW reminders
 * - Offer updates
 * - Payment reminders
 */

require_once __DIR__ . '/../../config.php';

// Email configuration
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'your-email@gmail.com'); // Update this
define('SMTP_PASS', 'your-app-password'); // Update this
define('FROM_EMAIL', 'noreply@automall.com');
define('SHOP_PHONE', '+639091234567');
define('SHOP_EMAIL', 'support@automall.com');

// =====================================================
// EMAIL NOTIFICATION TEMPLATES
// =====================================================

class NotificationService {
    
    /**
     * Send welcome email on account creation
     */
    public static function send_welcome_email($user_email, $user_name, $role) {
        $subject = "Welcome to AUTOMALL";

        $role_label = strtoupper($role);

        $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.15); }
        .header { background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff; padding: 20px 24px; }
        .header h1 { margin: 0; font-size: 22px; }
        .badge { display: inline-block; margin-top: 6px; padding: 4px 8px; border-radius: 999px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(15,23,42,0.9); }
        .content { padding: 20px 24px 8px 24px; color: #111827; font-size: 14px; line-height: 1.6; }
        .content p { margin: 0 0 10px 0; }
        .highlight { padding: 10px 12px; border-radius: 6px; background: #eef2ff; font-size: 13px; margin: 12px 0; }
        .list { padding-left: 16px; margin: 10px 0 0 0; }
        .list li { margin-bottom: 4px; }
        .cta { margin: 18px 0 6px 0; }
        .cta a { display: inline-block; padding: 10px 18px; border-radius: 999px; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; }
        .cta a:hover { background: #1d4ed8; }
        .meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .footer { padding: 12px 24px 18px 24px; font-size: 11px; color: #9ca3af; text-align: center; }
    </style>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to AUTOMALL</h1>
            <div class="badge">$role_label ACCOUNT</div>
        </div>
        <div class="content">
            <p>Hi $user_name,</p>
            <p>Thank you for creating your AUTOMALL account. Your profile is now connected to our unified showroom system so staff can recognize you quickly and keep your vehicles and appointments in sync.</p>

            <div class="highlight">
                <strong>What you can do now:</strong>
                <ul class="list">
                    <li>Log in to the showroom web app</li>
                    <li>Access your dashboard and activity</li>
                    <li>Update your notification and theme settings</li>
                </ul>
            </div>

            <p class="cta">
                <a href="http://localhost/automall%20proj/" target="_blank" rel="noopener noreferrer">Open AUTOMALL Dashboard</a>
            </p>
            <p class="meta">If this wasn’t you, please contact us at <strong>{$SHOP_EMAIL}</strong> or call <strong>{$SHOP_PHONE}</strong> so we can secure the account.</p>
        </div>
        <div class="footer">
            <p>© 2026 AUTOMALL. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;

        return self::send_email($user_email, $subject, $body);
    }
    
    /**
     * Send appointment confirmation email
     */
    public static function send_appointment_confirmation($user_email, $user_name, $vehicle, $appointment_date) {
        $subject = "Appointment Confirmed - AUTOMALL";
        
        $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Appointment Confirmed!</h1>
        </div>
        <div class="content">
            <p>Hi $user_name,</p>
            <p>Your appointment has been confirmed for:</p>
            <h3>{$vehicle['make_model_year']}</h3>
            <p><strong>Date & Time:</strong> {$appointment_date}</p>
            <p><strong>Location:</strong> AUTOMALL Showroom</p>
            <p><strong>Address:</strong> 123 Car Street, Manila, Philippines</p>
            <p><strong>Contact:</strong> {$SHOP_PHONE}</p>
            <p style="color: #ff6600;"><strong>💡 Tip:</strong> You'll receive an OTW reminder 2 hours before your appointment.</p>
            <p>See you soon!</p>
        </div>
        <div class="footer">
            <p>© 2026 AUTOMALL. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
HTML;
        
        return self::send_email($user_email, $subject, $body);
    }
    
    /**
     * Send OTW reminder email
     */
    public static function send_otw_reminder($user_email, $user_name, $vehicle, $appointment_date) {
        $subject = "⏰ OTW Reminder - AUTOMALL";
        
        $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert">
            <h2>⏰ Time to Head Out!</h2>
            <p>Hi $user_name,</p>
            <p>Your appointment is in 2 hours:</p>
            <p><strong>Vehicle:</strong> {$vehicle['make_model_year']}</p>
            <p><strong>When:</strong> {$appointment_date}</p>
            <p style="color: #d9534f;"><strong>Important:</strong> Please confirm you're on the way in the AUTOMALL app to reserve the vehicle.</p>
        </div>
    </div>
</body>
</html>
HTML;
        
        return self::send_email($user_email, $subject, $body);
    }
    
    /**
     * Send offer response email
     */
    public static function send_offer_response($buyer_email, $buyer_name, $vehicle, $response_type, $amount = null) {
        $subject = "Offer Update - AUTOMALL";
        
        if ($response_type === 'accepted') {
            $message = "Your offer has been <strong style='color: green;'>ACCEPTED</strong>!";
            $next_step = "Contact the seller to arrange payment and delivery.";
        } elseif ($response_type === 'rejected') {
            $message = "Your offer has been <strong style='color: red;'>REJECTED</strong>.";
            $next_step = "You can browse other vehicles or submit a new offer.";
        } else { // countered
            $message = "The seller has sent a <strong style='color: blue;'>COUNTER OFFER</strong> of ₱" . number_format($amount);
            $next_step = "Log in to AUTOMALL to accept or counter again. You have 24 hours to respond.";
        }
        
        $body = <<<HTML
<!DOCTYPE html>
<html>
<body>
    <div style="max-width: 600px; margin: 0 auto;">
        <h2>$message</h2>
        <p>Vehicle: {$vehicle['make_model_year']}</p>
        <p>$next_step</p>
        <p><a href="https://automall.local">Go to AUTOMALL</a></p>
    </div>
</body>
</html>
HTML;
        
        return self::send_email($buyer_email, $subject, $body);
    }
    
    /**
     * Send payment reminder email
     */
    public static function send_payment_reminder($seller_email, $seller_name, $rent_amount, $due_date) {
        $subject = "💳 Slot Rental Payment Due - AUTOMALL";
        
        $body = <<<HTML
<!DOCTYPE html>
<html>
<body>
    <div style="max-width: 600px; margin: 0 auto;">
        <h2>Slot Rental Payment Reminder</h2>
        <p>Hi $seller_name,</p>
        <p><strong>Amount Due:</strong> ₱" . number_format($rent_amount) . "</p>
        <p><strong>Due Date:</strong> $due_date</p>
        <p>Pay online or visit our office to avoid late fees.</p>
        <p><a href="https://automall.local/payment">Pay Now</a></p>
    </div>
</body>
</html>
HTML;
        
        return self::send_email($seller_email, $subject, $body);
    }
    
    /**
     * Generic email sender
     */
    private static function send_email($to, $subject, $body) {
        // Using PHPMailer would be better for production
        // For now, using mail() as fallback
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8" . "\r\n";
        $headers .= "From: " . FROM_EMAIL . "\r\n";
        $headers .= "Reply-To: " . SHOP_EMAIL . "\r\n";
        
        $success = mail($to, $subject, $body, $headers);
        
        if (!$success) {
            error_log("Failed to send email to $to");
        }
        
        return $success;
    }
}

// =====================================================
// SMS NOTIFICATION (Using Twilio or similar service)
// =====================================================

class SMSService {
    // Configure with Twilio or another SMS provider
    const TWILIO_SID = 'your-twilio-sid';
    const TWILIO_AUTH = 'your-twilio-auth-token';
    const TWILIO_PHONE = '+1234567890';
    
    /**
     * Send OTW reminder SMS
     */
    public static function send_otw_sms($phone_number, $vehicle_name) {
        $message = "AUTOMALL: Your appointment for $vehicle_name is in 2 hours! Click the app to confirm you're on the way.";
        return self::send_sms($phone_number, $message);
    }
    
    /**
     * Send appointment confirmation SMS
     */
    public static function send_appointment_sms($phone_number, $vehicle_name, $time) {
        $message = "AUTOMALL: Your viewing for $vehicle_name is confirmed on $time. See you at the showroom!";
        return self::send_sms($phone_number, $message);
    }
    
    /**
     * Generic SMS sender
     */
    private static function send_sms($to, $message) {
        // Implement Twilio API call here
        // Example:
        /*
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => "https://api.twilio.com/2010-04-01/Accounts/" . self::TWILIO_SID . "/Messages.json",
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query(['To' => $to, 'From' => self::TWILIO_PHONE, 'Body' => $message]),
            CURLOPT_USERPWD => self::TWILIO_SID . ":" . self::TWILIO_AUTH,
            CURLOPT_RETURNTRANSFER => true
        ));
        $response = curl_exec($curl);
        curl_close($curl);
        return $response;
        */
        
        error_log("SMS to $to: $message");
        return true;
    }
}

// =====================================================
// NOTIFICATION DISPATCHER ENDPOINTS
// =====================================================

set_cors_headers();

// Trigger OTW reminder (can be called by CRON)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], 'send_otw_reminders.php') !== false) {
    try {
        // Find appointments in next 2-2.25 hours
        $appointments = fetch_all(
            'SELECT 
                da.Appointment_ID,
                da.Schedule_DateTime,
                ua.Email,
                ua.First_Name,
                ua.Phone_Number,
                vi.Make_Model_Year
             FROM D3_Master_Calendar da
             JOIN D1_Unified_Accounts ua ON da.User_ID = ua.User_ID
             JOIN D2_Vehicle_Inventory vi ON da.Target_Vehicle_ID = vi.Vehicle_ID
             WHERE da.Appt_Status = "Scheduled"
             AND da.Schedule_DateTime BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 135 MINUTES)
             AND da.Confirmation_Sent_At IS NULL'
        );
        
        $sent = 0;
        foreach ($appointments as $apt) {
            // Send email
            NotificationService::send_otw_reminder(
                $apt['Email'],
                $apt['First_Name'],
                ['make_model_year' => $apt['Make_Model_Year']],
                $apt['Schedule_DateTime']
            );
            
            // Send SMS
            SMSService::send_otw_sms($apt['Phone_Number'], $apt['Make_Model_Year']);
            
            // Mark as sent
            update_record(
                'D3_Master_Calendar',
                ['Confirmation_Sent_At' => date('Y-m-d H:i:s')],
                'Appointment_ID = ?',
                [$apt['Appointment_ID']]
            );
            
            $sent++;
        }
        
        json_response(success_response([
            'reminders_sent' => $sent
        ], "Sent $sent OTW reminders"), 200);
        
    } catch (Exception $e) {
        error_log('Error in send_otw_reminders.php: ' . $e->getMessage());
        error_response('Error sending reminders', 500);
    }
}

?>
