import React from 'react';
import { ajaxHelper } from 'ajax_helper';
import { useDispatch } from '../../app/components/StateProvider'

const usePool = () => {
  const dispatch = useDispatch()

  const fetchPools = (lbID, marker) => {
    return new Promise((handleSuccess,handleError) => { 
      const params = {}
      if(marker) params['marker'] = marker.id
      ajaxHelper.get(`/loadbalancers/${lbID}/pools`, {params: params }).then((response) => {
        handleSuccess(response.data)
      })
      .catch( (error) => {
        handleError(error)
      })
    })
  }

  const persistPools = (lbID, marker) => {
    dispatch({type: 'RESET_POOLS'})
    dispatch({type: 'REQUEST_POOLS'})
    return new Promise((handleSuccess,handleError) => {
      fetchPools(lbID, marker).then((data) => {
        dispatch({type: 'RECEIVE_POOLS', items: data.pools, hasNext: data.has_next})
        handleSuccess(data)
      }).catch( error => {
        dispatch({type: 'REQUEST_POOLS_FAILURE', error: error})
        handleError(error.response)
      })
    })
  }
  
  const fetchPool = (lbID, poolID) => {
    return new Promise((handleSuccess,handleError) => {    
      ajaxHelper.get(`/loadbalancers/${lbID}/pools/${poolID}`).then((response) => {      
        dispatch({type: 'RECEIVE_POOL', pool: response.data.pool})
        handleSuccess(response.data.pool)
      }).catch( (error) => {
        if(error.response && error.response.status == 404) {
          dispatch({type: 'REMOVE_POOL', id: poolID})
        }        
        handleError(error.response)
      })      
    })
  }

  const createPool = (lbID, values) => {
    return new Promise((handleSuccess,handleErrors) => {
      ajaxHelper.post(`/loadbalancers/${lbID}/pools`, { pool: values }).then((response) => {
        dispatch({type: 'RECEIVE_POOL', pool: response.data}) 
        handleSuccess(response)
      }).catch(error => {
        handleErrors(error)
      })
    })
  }

  const findPool = (pools, poolID) => {
    if (pools) {
      const index = pools.findIndex((item) => item.id==poolID);
      if (index>=0) { 
        return pools[index]
      } 
    }
    return null
  }

  const setSearchTerm = (searchTerm) => {
    dispatch({type: 'SET_POOLS_SEARCH_TERM', searchTerm: searchTerm})
  }

  const setSelected = (item) => {
    dispatch({type: 'SET_POOLS_SELECTED_ITEM', selected: item})
  }

  const reset = () => {
    dispatch({type: 'SET_POOLS_SEARCH_TERM', searchTerm: null})
    dispatch({type: 'SET_POOLS_SELECTED_ITEM', selected: null})
  }

  const lbAlgorithmTypes = () => {
    return [
      {label: "LEAST_CONNECTIONS", value: "LEAST_CONNECTIONS"},
      {label: "ROUND_ROBIN", value: "ROUND_ROBIN"},
      {label: "SOURCE_IP", value: "SOURCE_IP"},
      {label: "SOURCE_IP_PORT", value: "SOURCE_IP_PORT"}]
  }

  const protocolTypes = (type) => {
    switch (type) {
      case 'HTTP':
        return {label: "HTTP", value: "HTTP"}
      case 'HTTPS':
        return {label: "HTTPS", value: "HTTPS"}
      case 'PROXY':
        return {label: "PROXY", value: "PROXY"}
      case 'TCP':
        return {label: "TCP", value: "TCP"}
      case 'UDP':
        return {label: "UDP", value: "UDP"}
      default:
        return [
          {label: "HTTP", value: "HTTP"},
          {label: "HTTPS", value: "HTTPS"},
          {label: "PROXY", value: "PROXY"},
          {label: "TCP", value: "TCP"},
          {label: "UDP", value: "UDP"}]
    }
  }

  const poolPersistenceTypes = () => {
    return [
    {label: "APP_COOKIE", value: "APP_COOKIE", description: "Use the specified cookie_name send future requests to the same member."},
    {label: "HTTP_COOKIE", value: "HTTP_COOKIE", description: "The load balancer will generate a cookie that is inserted into the response. This cookie will be used to send future requests to the same member."},
    {label: "SOURCE_IP", value: "SOURCE_IP", description: "The source IP address on the request will be hashed to send future requests to the same member."}]
  }

  const protocolListenerPoolCombinations = (listenerProtocol) => {
    switch (listenerProtocol) {
      case 'HTTP':
        return [protocolTypes('HTTP'),protocolTypes('PROXY')]
      case 'HTTPS':
        return [protocolTypes('HTTPS'),protocolTypes('PROXY'),protocolTypes('TCP')]
      case 'TCP':
        return [protocolTypes('HTTP'), protocolTypes('HTTPS'), protocolTypes('PROXY'), protocolTypes('TCP')]
      case 'TERMINATED_HTTPS':
        return [protocolTypes('HTTP'), protocolTypes('PROXY')]
      case 'UDP':
        return [protocolTypes('UDP')]
      default:
        return protocolTypes()
    }
  }

  return {
    fetchPools,
    persistPools,
    fetchPool,
    createPool,
    setSearchTerm,
    setSelected,
    reset,
    findPool,
    lbAlgorithmTypes,
    protocolTypes,
    poolPersistenceTypes,
    protocolListenerPoolCombinations
  };
}
 
export default usePool;