const Content = require('@models/ContentManagment');
const response = require('../responses');

exports.getContent = async (req, res) => {
  try {
    const content = await Content.find();
    if (!content) {
      return res
        .status(404)
        .json({ message: 'Content not found. Please create content first.' });
    }
    return response.ok(res, content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const { id, policy, terms } = req.body;
    // If ID is missing → CREATE new content
    if (!id || id === null || id === "" || id === undefined) {
      const newContent = await Content.create({ policy, terms });

      return res.status(201).json({
        message: "Content created successfully",
        data: newContent,
      });
    }

    // If ID is present → UPDATE existing content
    const updatedContent = await Content.findByIdAndUpdate(
      id,
      { policy, terms },
      { new: true }
    );

    if (!updatedContent) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json({
      message: "Content updated successfully",
      data: updatedContent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

