import { useEffect, useState, useMemo } from 'react'
import HelpPopover from '../shared/HelpPopover'
import { useGlobalState } from '../StateProvider'
import useCommons from '../../../lib/hooks/useCommons'
import useHealthMonitor from '../../../lib/hooks/useHealthMonitor'
import {DefeatableLink} from 'lib/components/defeatable_link';
import usePool from '../../../lib/hooks/usePool'
import ErrorPage from '../ErrorPage';
import { addNotice, addError } from 'lib/flashes';
import { ErrorsList } from 'lib/elektra-form/components/errors_list';
import { Link } from 'react-router-dom';
import HealthmonitorDetails from './HealthmonitorDetails'
import { policy } from "policy";
import { scope } from "ajax_helper";
import SmartLink from "../shared/SmartLink"

const HealthMonitor = ({props, loadbalancerID }) => {
  const {deleteHealthmonitor,persistHealthmonitor, resetState} = useHealthMonitor()
  const poolID = useGlobalState().pools.selected
  const pools = useGlobalState().pools.items
  const {findPool,persistPool} = usePool()
  const {searchParamsToString,matchParams,errorMessage} = useCommons()
  const state = useGlobalState().healthmonitors

  useEffect(() => {   
    initialLoad()
  }, [poolID]);

  const initialLoad = () => {
    // if pool selected
    if (poolID) {
      // find the pool to get the health monitor id      
      const pool = findPool(pools, poolID)
      if (pool && pool.healthmonitor_id) {
        console.log("FETCH HEALTH MONITOR")
        persistHealthmonitor(loadbalancerID, poolID, pool.healthmonitor_id, null).then((data) => {                    
        }).catch( error => {
        })
      } else {
        // reset state
        resetState()
      }
    }
  }

  const canCreate = useMemo(
    () => 
      policy.isAllowed("lbaas2:healthmonitor_create", {
        target: { scoped_domain_name: scope.domain }
      }),
    [scope.domain]
  );

  const canEdit = useMemo(
    () => 
      policy.isAllowed("lbaas2:healthmonitor_update", {
        target: { scoped_domain_name: scope.domain }
      }),
    [scope.domain]
  );

  const canDelete = useMemo(
    () => 
      policy.isAllowed("lbaas2:healthmonitor_delete", {
        target: { scoped_domain_name: scope.domain }
      }),
    [scope.domain]
  );

  const onRemoveClick = (e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    const params = matchParams(props)
    const lbID = params.loadbalancerID
    const healthmonitorID = healthmonitor.id.slice()
    const healthmonitorName = healthmonitor.name.slice()
    return deleteHealthmonitor(lbID, poolID, healthmonitorID,healthmonitorName).then((response) => {
      addNotice(<React.Fragment>Health Monitor <b>{healthmonitorName}</b> ({healthmonitorID}) is being deleted.</React.Fragment>)
      // fetch the pool again containing the new healthmonitor so it gets updated fast
      persistPool(lbID,poolID).then(() => {
      }).catch(error => {
      })
    }).catch(error => {
      addError(React.createElement(ErrorsList, {
        errors: errorMessage(error.response)
      }))
    })
  }

  const error = state.error
  const healthmonitor = state.item
  const isLoading = state.isLoading

  return useMemo(() => {
    console.log("RENDER healthmonitor")
    return ( 
      <React.Fragment>
        {poolID &&
          <React.Fragment>
            {error ?
              <div className="healthmonitor subtable multiple-subtable-left">
                <ErrorPage headTitle="Health Monitor" error={error} onReload={initialLoad}/>
              </div>
            :
              <div className="healthmonitor subtable multiple-subtable-left">
                <div className="display-flex multiple-subtable-header">
                  <h4>Health Monitor</h4>
                  <HelpPopover text="Checks the health of the pool members. Unhealthy members will be taken out of traffic schedule. Set's a load balancer to OFFLINE when all members are unhealthy." />
                </div>

                <div className="toolbar searchToolbar">
                  { healthmonitor ?
                    <div className="main-buttons">
                      <div className='btn-group   '>
                        <button
                          className='btn btn-default btn-xs dropdown-toggle'
                          type="button"
                          data-toggle="dropdown"
                          aria-expanded={true}>
                          <span className="fa fa-cog"></span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-right" role="menu">
                          <li>              
                            <SmartLink 
                              to={`/loadbalancers/${loadbalancerID}/pools/${poolID}/healthmonitor/${healthmonitor.id}/edit?${searchParamsToString(props)}`}
                              isAllowed={canEdit} 
                              notAllowedText="Not allowed to edit. Please check with your administrator.">
                                Edit
                            </SmartLink>
                          </li>
                          <li>
                            <SmartLink 
                              onClick={onRemoveClick} 
                              isAllowed={canDelete} 
                              notAllowedText="Not allowed to delete. Please check with your administrator.">
                                Delete
                            </SmartLink>
                          </li>
                        </ul>
                      </div>
                    </div>
                  :
                    <div className="main-buttons">
                      <SmartLink
                        disabled={isLoading}
                        to={`/loadbalancers/${loadbalancerID}/pools/${poolID}/healthmonitor/new?${searchParamsToString(props)}`}
                        className='btn btn-primary btn-xs'
                        isAllowed={canCreate}
                        notAllowedText="Not allowed to create. Please check with your administrator.">
                        New Health Monitor
                      </SmartLink>
                    </div>
                  }     
                </div> 

                {healthmonitor ?
                  <HealthmonitorDetails loadbalancerID={loadbalancerID} poolID={poolID} healthmonitor={healthmonitor} />
                :
                  <div className="multiple-subtable-scroll-body">
                    { isLoading ? <span className='spinner'/> : 'No Health Monitor found' }
                  </div>
                }
              </div>
            }        
          </React.Fragment>
        }
      </React.Fragment>
    );
  } , [ JSON.stringify(healthmonitor), error, isLoading, props])
}
 
export default HealthMonitor;