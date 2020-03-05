import { Highlighter } from 'react-bootstrap-typeahead'
import { Link } from 'react-router-dom';
import LbPopover from './LbPoopover';
import LbPopoverListenerContent from './LbPopoverListenerContent';
import LbPopoverPoolContent from './LbPopoverPoolContent';
import StaticTags from '../StaticTags';
import StateLabel from '../StateLabel'
import useStatusTree from '../../../lib/hooks/useStatusTree'
import { confirm } from 'lib/dialogs';
import { addNotice, addError } from 'lib/flashes';
import { ajaxHelper } from 'ajax_helper';
import { ErrorsList } from 'lib/elektra-form/components/errors_list';

const MyHighlighter = ({search,children}) => {
  if(!search || !children) return children
  return <Highlighter search={search}>{children+''}</Highlighter>
}

const LoadbalancerItem = React.memo(({loadbalancer, searchTerm, disabled}) => {
  console.log('RENDER loadbalancer list item id-->', loadbalancer.id)
  
  // poll the status tree for this lb
  useStatusTree({lbId: loadbalancer.id})

  const errorMessage = (err) => {
    return err.data &&  (err.data.errors || err.data.error) || err.message
  }  

  const handleDelete = (e) => {
    e.preventDefault()
    confirm(`Do you really want to delete the loadbalancer ${loadbalancer.id}?`).then(() => {
      return ajaxHelper.delete(`/loadbalancers/${loadbalancer.id}`)
      .then( (response) => {
        addNotice('test')
      })
      .catch( (error) => {     
        addError(React.createElement(ErrorsList, {
          errors: errorMessage(error)
        }))
      });
    }).catch(cancel => true)
  }

  const poolIds = loadbalancer.pools.map(p => p.id)
  const listenerIds = loadbalancer.listeners.map(l => l.id)
  return(
    <tr className={disabled ? "active" : ""}>
      <td className="snug-nowrap">
        {disabled ?
            <span className="info-text"><MyHighlighter search={searchTerm}>{loadbalancer.name || loadbalancer.id}</MyHighlighter></span>
         :
          <Link to={`/loadbalancers/${loadbalancer.id}/show`}>
            <MyHighlighter search={searchTerm}>{loadbalancer.name || loadbalancer.id}</MyHighlighter>
          </Link>
         }
        {loadbalancer.name && 
            <React.Fragment>
              <br/>
              <span className="info-text"><MyHighlighter search={searchTerm}>{loadbalancer.id}</MyHighlighter></span>
            </React.Fragment>
          }
      </td>
      <td>{loadbalancer.description}</td>
      <td><StateLabel lbId={loadbalancer.id} placeholder={loadbalancer.operating_status} path="operating_status" /></td>
      <td><StateLabel lbId={loadbalancer.id} placeholder={loadbalancer.provisioning_status} path="provisioning_status"/></td>
      <td>
        <StaticTags tags={loadbalancer.tags} />
      </td>
      <td className="snug-nowrap">
        {loadbalancer.subnet && 
          <React.Fragment>
            <p className="list-group-item-text" data-is-from-cache={loadbalancer.subnet_from_cache}>{loadbalancer.subnet.name}</p>
          </React.Fragment>
        }
        {loadbalancer.vip_address && 
          <React.Fragment>
            <p className="list-group-item-text">
              <i className="fa fa-desktop fa-fw"/>
              {loadbalancer.vip_address}
            </p>
          </React.Fragment>
        }
        {loadbalancer.floating_ip && 
          <React.Fragment>
            <p className="list-group-item-text">
              <i className="fa fa-globe fa-fw"/>
              {loadbalancer.floating_ip.floating_ip_address}
            </p>
          </React.Fragment>
        }
      </td>
      <td> 
        {disabled ?
          <span className="info-text">{listenerIds.length}</span>
        :
        <LbPopover  popoverId={"listener-popover-"+loadbalancer.id} 
                    buttonName={listenerIds.length} 
                    title={<React.Fragment>Listeners<Link to={`/listeners/`} style={{float: 'right'}}>Show all</Link></React.Fragment>}
                    content={<LbPopoverListenerContent listenerIds={listenerIds} cachedListeners={loadbalancer.cached_listeners}/>} />
        }
      </td>
      <td>
      {disabled ?
          <span className="info-text">{poolIds.length}</span>
        :
        <LbPopover  popoverId={"pools-popover-"+loadbalancer.id} 
                    buttonName={poolIds.length} 
                    title={<React.Fragment>Pools<Link to={`/pools/`} style={{float: 'right'}}>Show all</Link></React.Fragment>}
                    content={<LbPopoverPoolContent poolIds={poolIds} cachedPools={loadbalancer.cached_pools}/>} />
      }
      </td>
      <td>
        <div className='btn-group'>
          <button
            className='btn btn-default btn-sm dropdown-toggle'
            disabled={disabled}
            type="button"
            data-toggle="dropdown"
            aria-expanded={true}>
            <span className="fa fa-cog"></span>
          </button>
          <ul className="dropdown-menu dropdown-menu-right" role="menu">
            <li><a href='#' onClick={handleDelete}>Delete</a></li>
          </ul>
        </div>
      </td>
    </tr>
  )
})
LoadbalancerItem.displayName = 'LoadbalancerItem';

export default LoadbalancerItem;