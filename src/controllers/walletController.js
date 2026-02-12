const Commission = require('@models/Commission');
const Withdrawal = require('@models/Withdrawal');
const Order = require('@models/Order');
const response = require('../responses');

module.exports = {
  getAffiliateWallet: async (req, res) => {
    try {
      const affiliateId = req.user.id;

      const commissions = await Commission.find({ affiliate: affiliateId })
        .populate('product', 'name')
        .populate('campaign', 'name')
        .sort({ createdAt: -1 });

      const totalCommission = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

      const withdrawals = await Withdrawal.find({ user: affiliateId });
      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      const availableBalance = totalCommission - totalWithdrawn;

      return response.ok(res, {
        commissions,
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
        availableBalance: parseFloat(availableBalance.toFixed(2))
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getCompanyWallet: async (req, res) => {
    try {
      const companyId = req.user.id;

      const orders = await Order.find({ 'trackingInfo.companyId': companyId });
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (order.totalAmount - (order.admin_commission || 0));
      }, 0);

      const commissions = await Commission.find({ company: companyId });
      const totalCommissionPaid = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);

      const withdrawals = await Withdrawal.find({ user: companyId });
      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      const availableBalance = totalRevenue - totalCommissionPaid - totalWithdrawn;

      return response.ok(res, {
        orders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCommissionPaid: parseFloat(totalCommissionPaid.toFixed(2)),
        totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
        availableBalance: parseFloat(availableBalance.toFixed(2))
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  requestWithdrawal: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, bankDetails } = req.body;

      if (!amount || amount <= 0) {
        return response.badReq(res, { message: 'Invalid amount' });
      }

      let availableBalance = 0;
      if (req.user.role === 'user') {
        const commissions = await Commission.find({ affiliate: userId });
        const totalCommission = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
        const withdrawals = await Withdrawal.find({ user: userId, status: 'completed' });
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        availableBalance = totalCommission - totalWithdrawn;
      } else if (req.user.role === 'company') {
        const orders = await Order.find({ 'trackingInfo.companyId': userId });
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount - (order.admin_commission || 0)), 0);
        const commissions = await Commission.find({ company: userId });
        const totalCommissionPaid = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
        const withdrawals = await Withdrawal.find({ user: userId, status: 'completed' });
        const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        availableBalance = totalRevenue - totalCommissionPaid - totalWithdrawn;
      }

      if (amount > availableBalance) {
        return response.badReq(res, { message: 'Insufficient balance' });
      }

      const withdrawal = new Withdrawal({
        user: userId,
        amount,
        bankDetails,
        status: 'pending'
      });

      await withdrawal.save();

      return response.ok(res, {
        message: 'Withdrawal request submitted successfully',
        withdrawal
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getWithdrawalHistory: async (req, res) => {
    try {
      const userId = req.user.id;

      const withdrawals = await Withdrawal.find({ user: userId })
        .sort({ createdAt: -1 });

      return response.ok(res, withdrawals);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getAllWithdrawals: async (req, res) => {
    try {
      const withdrawals = await Withdrawal.find()
        .populate('user', 'name email role')
        .sort({ createdAt: -1 });

      return response.ok(res, withdrawals);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateWithdrawalStatus: async (req, res) => {
    try {
      const { withdrawalId } = req.params;
      const { status, rejectionReason, transactionId } = req.body;

      const withdrawal = await Withdrawal.findById(withdrawalId);
      
      if (!withdrawal) {
        return response.notFound(res, { message: 'Withdrawal request not found' });
      }

      withdrawal.status = status;
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;

      if (status === 'rejected' && rejectionReason) {
        withdrawal.rejectionReason = rejectionReason;
      }

      if (status === 'completed' && transactionId) {
        withdrawal.transactionId = transactionId;
      }

      await withdrawal.save();

      return response.ok(res, {
        message: `Withdrawal request ${status} successfully`,
        withdrawal
      });
    } catch (error) {
      return response.error(res, error);
    }
  }
};
