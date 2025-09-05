const db = require("../../db/db");

const schema = process.env.NODE_ENV == 'production' ? process.env.DB_SCHEMA : (process.env.DEV_SCHEMA || 'public');

// Add a link
exports.addLink = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, url } = req.body;

        const insertQuery = `
      INSERT INTO ${schema}.user_links (user_id, title, url)
      VALUES ($1, $2, $3)
      RETURNING id, title, url
    `;
        const result = await db.query(insertQuery, [
            userId,
            title,
            url,
        ]);

        return res.status(201).json({
            success: true,
            data: {
                link: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    url: result.rows[0].url,
                },
            },
            message: "Link added successfully",
        });
    } catch (error) {
        console.error("Add link error:", error);
        next(error);
    }
};

// Update a link
exports.updateLink = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { linkId } = req.params;
        const { title, url } = req.body;

        // First check if the link belongs to the user
        const checkQuery = `
      SELECT id FROM ${schema}.user_links 
      WHERE id = $1 AND user_id = $2
    `;
        const checkResult = await db.query(checkQuery, [linkId, userId]);

        if (checkResult.rows.length === 0) {
            const error = new Error("Link not found or not authorized");
            error.status = 404;
            error.code = "LINK_NOT_FOUND";
            return next(error);
        }

        const updateQuery = `
      UPDATE ${schema}.user_links
      SET title = $1, url = $2
      WHERE id = $3 AND user_id = $4
      RETURNING id, title, url
    `;
        const result = await db.query(updateQuery, [
            title,
            url,
            linkId,
            userId,
        ]);

        return res.status(200).json({
            success: true,
            data: {
                link: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    url: result.rows[0].url,
                },
            },
            message: "Link updated successfully",
        });
    } catch (error) {
        console.error("Update link error:", error);
        next(error);
    }
};

// Delete a link
exports.deleteLink = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { linkId } = req.params;

        // First check if the link belongs to the user
        const checkQuery = `
      SELECT id FROM ${schema}.user_links 
      WHERE id = $1 AND user_id = $2
    `;
        const checkResult = await db.query(checkQuery, [linkId, userId]);

        if (checkResult.rows.length === 0) {
            const error = new Error("Link not found or not authorized");
            error.status = 404;
            error.code = "LINK_NOT_FOUND";
            return next(error);
        }

        const deleteQuery = `
      DELETE FROM ${schema}.user_links
      WHERE id = $1 AND user_id = $2
    `;
        await db.query(deleteQuery, [linkId, userId]);

        return res.status(200).json({
            success: true,
            message: "Link deleted successfully",
        });
    } catch (error) {
        console.error("Delete link error:", error);
        next(error);
    }
};
