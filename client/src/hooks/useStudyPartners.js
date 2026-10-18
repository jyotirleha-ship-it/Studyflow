import { useState, useEffect, useCallback, useMemo } from 'react';
import { connectionAPI } from '../services/api.js';

/**
 * Custom hook for managing peer connections, incoming/outgoing requests,
 * and smart partner recommendations.
 * Employs useState, useEffect, useCallback, and useMemo.
 */
export const useStudyPartners = () => {
  const [connected, setConnected] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await connectionAPI.getConnections();
      if (res.data?.success) {
        setConnected(res.data.connected || []);
        setPendingIncoming(res.data.pendingIncoming || []);
        setPendingOutgoing(res.data.pendingOutgoing || []);
      }
    } catch (err) {
      console.error('Failed to load study partner connections', err);
      setError('Could not retrieve connections');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await connectionAPI.getRecommendations();
      if (res.data?.success) {
        setRecommendations(res.data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to load partner recommendations', err);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
    fetchRecommendations();
  }, [fetchConnections, fetchRecommendations]);

  const sendRequest = useCallback(async (recipientId, notes = '') => {
    try {
      const res = await connectionAPI.sendRequest({ recipientId, notes });
      if (res.data?.success) {
        await fetchConnections();
        await fetchRecommendations();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Failed to send request' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Error sending connection request';
      return { success: false, message: msg };
    }
  }, [fetchConnections, fetchRecommendations]);

  const respondRequest = useCallback(async (connectionId, action) => {
    try {
      const res = await connectionAPI.respondRequest(connectionId, { action });
      if (res.data?.success) {
        await fetchConnections();
        await fetchRecommendations();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: `Failed to ${action} request` };
    } catch (err) {
      const msg = err.response?.data?.message || `Error responding to request`;
      return { success: false, message: msg };
    }
  }, [fetchConnections, fetchRecommendations]);

  const totalPartnersCount = useMemo(() => connected.length, [connected]);
  const pendingRequestsCount = useMemo(() => pendingIncoming.length, [pendingIncoming]);

  return {
    connected,
    pendingIncoming,
    pendingOutgoing,
    recommendations,
    loading,
    error,
    totalPartnersCount,
    pendingRequestsCount,
    fetchConnections,
    fetchRecommendations,
    sendRequest,
    acceptRequest: (id) => respondRequest(id, 'accept'),
    rejectRequest: (id) => respondRequest(id, 'reject')
  };
};

export default useStudyPartners;
