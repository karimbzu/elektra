module Lbaas2

  class FakeFactory

    def loadbalancer(params = {})
      {vip_subnet_id: "456", vip_network_id: "123", name: "test lb"} 
    end

    def listener(params={})
      {name: "listener_test", protocol: "HTTP", protocol_port: "8080"}
    end

    def pool(params={})
      {name: "pool_test", lb_algorithm: "ROUND_ROBIN", protocol: "HTTP"}
    end

  end
end