export const sendAssignmentEmail = async ({email, userName, taskTitle,}) => {
    console.log("📧 Sending assignment email...");

    console.log(`To: ${email} User: ${userName} Task: ${taskTitle}`);

    // Simulate an email provider.
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    console.log(`✅ Mock email sent to ${email}`);


    return true;
};