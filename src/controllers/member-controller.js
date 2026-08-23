import { getMembers, updateMemberRole, removeMember } from "../services/member-services.js"

export const listMembers = async (req, res) => {
    try {
        const members = await getMembers(req.user.organizationId);

        return res.status(200).json({
            members,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }

}

export const changeMemberRole = async (req, res) => {
    try {
        const memberId = Number(req.params.id);
        const { role } = req.body;

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                message: "Invalid member id",
            });
        }

        const member = await updateMemberRole(
            memberId,
            req.user.organizationId,
            role
        );

        return res.status(200).json({
            message: "Member role updated successfully",
            member,
        });
    } catch (error) {
        console.error(error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }

}

export const deleteMember = async (req, res) => {
    try {
        const memberId = Number(req.params.id);

        if (!Number.isInteger(memberId)) {
            return res.status(400).json({
                message: "Invalid member id",
            });
        }

        await removeMember(
            memberId,
            req.user.organizationId,
            req.user.userId
        );

        return res.status(200).json({
            message: "Member removed successfully",
        });
    } catch (error) {
        console.error(error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}