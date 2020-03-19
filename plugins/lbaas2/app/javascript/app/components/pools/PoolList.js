import React from 'react';
import usePool from '../../../lib/hooks/usePool'
import { useEffect, useState } from 'react'
import {DefeatableLink} from 'lib/components/defeatable_link';
import PoolItem from './PoolItem'
import queryString from 'query-string'
import { Link } from 'react-router-dom';

const PoolList = ({props, loadbalancerID}) => {
  const {fetchPools} = usePool()
  const [searchTerm, setSearchTerm] = useState(null)
  const [selected, setSelected] = useState(null)
  const [state, setState] = useState({
    items: [],
    isLoading: false,
    receivedAt: null,
    hasNext: false,
    marker: null,
    error: null
  })

  useEffect(() => {  
    fetchPools(loadbalancerID, state.marker).then((data) => {
      updateState(data)
      selectPool()
    }).catch( error => {
      // TODO
    })
  }, [loadbalancerID]);

  const selectPool = () => {
    const values = queryString.parse(props.location.search)
    const id = values.pool

    if (id) {
      // pool was selected
      setSelected(id)
      // filter the pool list to show just the one item
      setSearchTerm(id)
    } else {
      // NOT FOUND
    }
  }

  const updateState = (data) => {
    let newItems = (state.items.slice() || []).concat(data.pools);
    // filter duplicated items
    newItems = newItems.filter( (item, pos, arr) => arr.findIndex(i => i.id == item.id)==pos );
    // create marker before sorting just in case there is any difference
    const marker = data.pools[data.pools.length-1]
    // sort
    newItems = newItems.sort((a, b) => a.name.localeCompare(b.name))
    setState({...state, 
      isLoading: false, 
      items: newItems, 
      error: null,
      hasNext: data.has_next,
      marker: marker,
      updatedAt: Date.now()})
  }

  const onSelectPool = (poolID) => {
    const id = poolID || ""
    const pathname = props.location.pathname; 
    const searchParams = new URLSearchParams(props.location.search); 
    searchParams.set("pool", id);
    props.history.push({
      pathname: pathname,
      search: searchParams.toString()
    })
    // pool was selected
    setSelected(poolID)
    // filter the pool list to show just the one item
    setSearchTerm(poolID)
  }

  const restoreUrl = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onSelectPool()
  }

  const loadNext = event => {
    if(!state.isLoading && state.hasNext) {
      fetchPools(loadbalancerID, state.marker)
    }
  }

  const error = state.error
  const isLoading = state.isLoading
  const hasNext = state.hasNext
  const items = state.items

  const filterItems = (searchTerm, items) => {
    if(!searchTerm) return items;
    // filter items      
    if (selected) {
      return items.filter((i) =>
        i.id == searchTerm.trim()
      )
    } else {
      const regex = new RegExp(searchTerm.trim(), "i");
      return items.filter((i) =>
      `${i.id} ${i.name} ${i.description}`.search(regex) >= 0
    )
    }
  }

  console.log("RENDER pool list")

  const pools = filterItems(searchTerm, items)
  return ( 
    <div className="details-section">
      <h4>Pools</h4>
      {error ?
        <ErrorPage headTitle="Load Balancers Pools" error={error}/>
        :
        <React.Fragment>
          <div className='toolbar'>
          { selected &&
              <Link className="back-link" to="#" onClick={restoreUrl}>
                <i className="fa fa-chevron-circle-left"></i>
                Back to pool list
              </Link>
            }

            <div className="main-buttons">
              <DefeatableLink
                disabled={selected || isLoading}
                to='/pools/new'
                className='btn btn-primary'>
                New Pool
              </DefeatableLink>
            </div>
          </div>

          <table className="table table-hover pools">
            <thead>
                <tr>
                    <th>Name/ID</th>
                    <th>Description</th>
                    <th>Protocol</th>
                    <th>Algorithm</th>
                    <th>#Members</th>
                    <th>State</th>
                    <th>Prov. Status</th>
                    <th className='snug'></th>
                </tr>
            </thead>
            <tbody>
              {pools && pools.length>0 ?
                pools.map( (pool, index) =>
                  <PoolItem pool={pool} searchTerm={searchTerm} key={index} onSelectPool={onSelectPool}/>
                )
                :
                <tr>
                  <td colSpan="8">
                    { isLoading ? <span className='spinner'/> : 'No pools found.' }
                  </td>
                </tr>  
              }
            </tbody>
          </table>  

        </React.Fragment>
      }
    </div>
   );
}
 
export default PoolList
;