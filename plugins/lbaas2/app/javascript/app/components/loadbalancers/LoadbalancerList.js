import { useDispatch, useGlobalState } from "../StateProvider"
import { useEffect, useMemo } from "react"
import LoadbalancerItem from "./LoadbalancerItem"
import ErrorPage from "../ErrorPage"
import { DefeatableLink } from "lib/components/defeatable_link"
import { SearchField } from "lib/components/search_field"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { Link } from "react-router-dom"
import useLoadbalancer from "../../../lib/hooks/useLoadbalancer"
import { Tooltip, OverlayTrigger } from "react-bootstrap"
import Pagination from "../shared/Pagination"
import { policy } from "policy"
import { scope } from "ajax_helper"
import SmartLink from "../shared/SmartLink"

const TableFadeTransition = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={200}
    unmountOnExit
    classNames="css-transition-fade"
  >
    {children}
  </CSSTransition>
)

const LoadbalancerList = (props) => {
  const dispatch = useDispatch()
  const state = useGlobalState().loadbalancers
  const { persistLoadbalancers } = useLoadbalancer()

  useEffect(() => {
    initLoad()
  }, [])

  const initLoad = () => {
    console.log("FETCH initial loadbalancers")
    persistLoadbalancers({ marker: state.marker }).catch((error) => {})
  }

  const canCreate = useMemo(
    () =>
      policy.isAllowed("lbaas2:loadbalancer_create", {
        target: { scoped_domain_name: scope.domain },
      }),
    [scope.domain]
  )

  const handlePaginateClick = (e, page) => {
    e.preventDefault()
    if (page === "all") {
      persistLoadbalancers({ limit: 9999 }).catch((error) => {})
    } else {
      persistLoadbalancers({ marker: state.marker }).catch((error) => {})
    }
  }

  const search = (term) => {
    if (hasNext && !isLoading) {
      persistLoadbalancers({ limit: 9999 }).catch((error) => {})
    }
    dispatch({ type: "SET_LOADBALANCER_SEARCH_TERM", searchTerm: term })
  }

  const error = state.error
  const isLoading = state.isLoading
  const hasNext = state.hasNext
  const searchTerm = state.searchTerm
  const items = state.items
  const selected = state.selected

  const filterItems = (searchTerm, items) => {
    if (!searchTerm) return items
    // filter items
    if (selected) {
      return items.filter((i) => i.id == searchTerm.trim())
    } else {
      const regex = new RegExp(searchTerm.trim(), "i")
      return items.filter(
        (i) =>
          `${i.id} ${i.name} ${i.description} ${i.vip_address} ${
            i.floating_ip && i.floating_ip.floating_ip_address
          }`.search(regex) >= 0
      )
    }
  }
  const loadbalancers = filterItems(searchTerm, items)
  return useMemo(() => {
    console.log("RENDER loadbalancer list")
    return (
      <React.Fragment>
        {error ? (
          <ErrorPage
            headTitle="Load Balancers"
            error={error}
            onReload={initLoad}
          />
        ) : (
          <React.Fragment>
            <div className="toolbar searchToolbar">
              {selected ? (
                <Link className="back-link" to={`/loadbalancers`}>
                  <i className="fa fa-chevron-circle-left"></i>
                  Back to Load Balancers
                </Link>
              ) : (
                <SearchField
                  value={searchTerm}
                  onChange={(term) => search(term)}
                  placeholder="name, ID, description, ip or fip"
                  text="Searches by name, ID, description, internal IP or assigned floating IP. All load balancers will be loaded."
                />
              )}
              <div className="main-buttons">
                {!selected && (
                  <SmartLink
                    className="btn btn-primary"
                    disabled={isLoading}
                    to="/loadbalancers/new"
                    className="btn btn-primary"
                    isAllowed={canCreate}
                    notAllowedText="Not allowed to create. Please check with your administrator."
                  >
                    New Load Balancer
                  </SmartLink>
                )}
              </div>
            </div>

            <TransitionGroup>
              <TableFadeTransition key={loadbalancers.length}>
                <table
                  className={
                    selected
                      ? "table loadbalancers"
                      : "table table-hover loadbalancers"
                  }
                >
                  <thead>
                    <tr>
                      <th>
                        <div className="display-flex">
                          Name
                          <div className="margin-left">
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id="defalult-pool-tooltip">
                                  Sorted by Name ASC
                                </Tooltip>
                              }
                            >
                              <i className="fa fa-sort-asc" />
                            </OverlayTrigger>
                          </div>
                          /ID/Description
                        </div>
                      </th>
                      <th>State</th>
                      <th>Prov. Status</th>
                      <th>Tags</th>
                      <th className="snug-nowrap">Subnet/IP Address</th>
                      <th>#Listeners</th>
                      <th>#Pools</th>
                      <th className="snug"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadbalancers && loadbalancers.length > 0 ? (
                      loadbalancers.map((loadbalancer, index) => (
                        <LoadbalancerItem
                          loadbalancer={loadbalancer}
                          disabled={selected ? true : false}
                          key={index}
                          searchTerm={searchTerm}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">
                          {isLoading ? (
                            <span className="spinner" />
                          ) : (
                            "No loadbalancers found."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableFadeTransition>
            </TransitionGroup>

            {loadbalancers.length > 0 && !selected && (
              <Pagination
                isLoading={isLoading}
                items={state.items}
                hasNext={hasNext}
                handleClick={handlePaginateClick}
              />
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }, [
    JSON.stringify(loadbalancers),
    error,
    selected,
    isLoading,
    searchTerm,
    hasNext,
  ])
}
export default LoadbalancerList
