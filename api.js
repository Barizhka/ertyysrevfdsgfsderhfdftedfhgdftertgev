// api.js - Эмуляция API через localStorage и Telegram Bot
class MagnateAPI {
    constructor() {
        this.botUsername = 'magnateotcbot';
        this.storageKey = 'magnate_otc_data';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                users: {},
                deals: {},
                tickets: {},
                sessions: {}
            }));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Имитация API вызовов к боту через Telegram
    async callBotMethod(method, params = {}) {
        // В реальности здесь будет вызов к вашему боту
        // Пока эмулируем ответ
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.handleBotMethod(method, params));
            }, 500);
        });
    }

    handleBotMethod(method, params) {
        const data = this.getData();
        
        switch (method) {
            case 'auth':
                const userId = params.user_id;
                if (!data.users[userId]) {
                    data.users[userId] = {
                        user_id: parseInt(userId),
                        username: `user_${userId}`,
                        balance: 1000,
                        successful_deals: 0,
                        ton_wallet: '',
                        card_details: '',
                        is_admin: userId === '7674627532' || userId === '8312808945'
                    };
                }
                
                const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
                data.sessions[sessionId] = parseInt(userId);
                this.saveData(data);
                
                return {
                    session_id: sessionId,
                    user: data.users[userId]
                };

            case 'create_deal':
                const dealId = 'deal_' + Math.random().toString(36).substr(2, 9);
                data.deals[dealId] = {
                    deal_id: dealId,
                    amount: parseFloat(params.amount),
                    description: params.description,
                    payment_method: params.payment_method,
                    seller_id: this.getUserIdFromSession(params.sessionId),
                    buyer_id: null,
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                this.saveData(data);
                
                return {
                    success: true,
                    deal_id: dealId,
                    deal_link: `https://t.me/${this.botUsername}?start=${dealId}`
                };

            case 'get_active_deals':
                const activeDeals = Object.values(data.deals).filter(deal => deal.status === 'active');
                return { deals: activeDeals };

            case 'create_ticket':
                const ticketId = 'ticket_' + Math.random().toString(36).substr(2, 9);
                const userIdForTicket = this.getUserIdFromSession(params.sessionId);
                data.tickets[ticketId] = {
                    ticket_id: ticketId,
                    user_id: userIdForTicket,
                    username: data.users[userIdForTicket]?.username || 'Unknown',
                    subject: params.subject,
                    message: params.message,
                    status: 'open',
                    admin_id: null,
                    admin_username: null,
                    created_at: new Date().toISOString()
                };
                this.saveData(data);
                
                return {
                    success: true,
                    ticket_id: ticketId
                };

            case 'get_my_tickets':
                const userTickets = Object.values(data.tickets).filter(
                    ticket => ticket.user_id === this.getUserIdFromSession(params.sessionId)
                );
                return { tickets: userTickets };

            case 'get_user_profile':
                const user = data.users[this.getUserIdFromSession(params.sessionId)];
                return user || { error: 'User not found' };

            case 'get_admin_deals':
                if (!this.isAdmin(params.sessionId, data)) {
                    return { error: 'Forbidden' };
                }
                return { deals: Object.values(data.deals) };

            case 'get_admin_tickets':
                if (!this.isAdmin(params.sessionId, data)) {
                    return { error: 'Forbidden' };
                }
                return { tickets: Object.values(data.tickets) };

            case 'get_admin_stats':
                if (!this.isAdmin(params.sessionId, data)) {
                    return { error: 'Forbidden' };
                }
                return {
                    total_users: Object.keys(data.users).length,
                    total_deals: Object.keys(data.deals).length,
                    active_deals: Object.values(data.deals).filter(d => d.status === 'active').length,
                    completed_deals: Object.values(data.deals).filter(d => d.status === 'completed').length,
                    open_tickets: Object.values(data.tickets).filter(t => t.status === 'open').length
                };

            default:
                return { error: 'Unknown method' };
        }
    }

    getUserIdFromSession(sessionId) {
        const data = this.getData();
        return data.sessions[sessionId];
    }

    isAdmin(sessionId, data) {
        const userId = this.getUserIdFromSession(sessionId);
        return data.users[userId]?.is_admin === true;
    }
}

// Создаем глобальный экземпляр API
window.MagnateAPI = new MagnateAPI();
