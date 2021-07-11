"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const ecs = require("@aws-cdk/aws-ecs");
const aws_ecr_assets_1 = require("@aws-cdk/aws-ecr-assets");
const aws_ecs_1 = require("@aws-cdk/aws-ecs");
const config_1 = require("../config");
const service_construct_1 = require("./service-construct");
class AirflowConstruct extends core_1.Construct {
    constructor(parent, name, props) {
        super(parent, name);
        const adminPassword = "bfcbd3a3-d88a-4113-9f53-0fef95ba7515";
        const ENV_VAR = {
            AIRFLOW__CORE__SQL_ALCHEMY_CONN: props.dbConnection,
            AIRFLOW__CELERY__BROKER_URL: "sqs://",
            AIRFLOW__CELERY__RESULT_BACKEND: "db+" + props.dbConnection,
            AIRFLOW__CORE__EXECUTOR: "CeleryExecutor",
            AIRFLOW__WEBSERVER__RBAC: "True",
            ADMIN_PASS: adminPassword,
            CLUSTER: props.cluster.clusterName,
            SECURITY_GROUP: props.defaultVpcSecurityGroup.securityGroupId,
            SUBNETS: props.privateSubnets.map(subnet => subnet.subnetId).join(",")
        };
        const logging = new ecs.AwsLogDriver({
            streamPrefix: 'FarFlowLogging',
            logRetention: config_1.airflowTaskConfig.logRetention
        });
        // Build Airflow docker image from Dockerfile
        const airflowImageAsset = new aws_ecr_assets_1.DockerImageAsset(this, 'AirflowBuildImage', {
            directory: './airflow',
        });
        const airflowTask = new aws_ecs_1.FargateTaskDefinition(this, 'AirflowTask', {
            cpu: config_1.airflowTaskConfig.cpu,
            memoryLimitMiB: config_1.airflowTaskConfig.memoryLimitMiB
        });
        let workerTask = airflowTask;
        if (config_1.airflowTaskConfig.createWorkerPool) {
            workerTask = new aws_ecs_1.FargateTaskDefinition(this, 'WorkerTask', {
                cpu: config_1.airflowTaskConfig.cpu,
                memoryLimitMiB: config_1.airflowTaskConfig.memoryLimitMiB
            });
        }
        let mmap = new Map();
        mmap.set(config_1.airflowTaskConfig.webserverConfig, airflowTask);
        mmap.set(config_1.airflowTaskConfig.schedulerConfig, airflowTask);
        mmap.set(config_1.airflowTaskConfig.workerConfig, workerTask);
        // Add containers to corresponding Tasks
        for (let entry of mmap.entries()) {
            let containerInfo = entry[0];
            let task = entry[1];
            task.addContainer(containerInfo.name, {
                image: ecs.ContainerImage.fromDockerImageAsset(airflowImageAsset),
                logging: logging,
                environment: ENV_VAR,
                entryPoint: [containerInfo.entryPoint],
                cpu: containerInfo.cpu,
                memoryLimitMiB: containerInfo.cpu
            }).addPortMappings({
                containerPort: containerInfo.containerPort
            });
        }
        new service_construct_1.ServiceConstruct(this, "AirflowService", {
            cluster: props.cluster,
            defaultVpcSecurityGroup: props.defaultVpcSecurityGroup,
            vpc: props.vpc,
            taskDefinition: airflowTask,
            isWorkerService: false
        });
        if (config_1.airflowTaskConfig.createWorkerPool) {
            new service_construct_1.ServiceConstruct(this, "WorkerService", {
                cluster: props.cluster,
                defaultVpcSecurityGroup: props.defaultVpcSecurityGroup,
                vpc: props.vpc,
                taskDefinition: workerTask,
                isWorkerService: true
            });
        }
        this.adminPasswordOutput = new core_1.CfnOutput(this, 'AdminPassword', {
            value: adminPassword
        });
    }
}
exports.AirflowConstruct = AirflowConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlyZmxvdy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhaXJmbG93LWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFtRDtBQUduRCx3Q0FBeUM7QUFFekMsNERBQTJEO0FBQzNELDhDQUF5RDtBQUV6RCxzQ0FBNkQ7QUFDN0QsMkRBQXVEO0FBV3ZELE1BQWEsZ0JBQWlCLFNBQVEsZ0JBQVM7SUFHN0MsWUFBWSxNQUFpQixFQUFFLElBQVksRUFBRSxLQUE0QjtRQUN2RSxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXBCLE1BQU0sYUFBYSxHQUFHLHNDQUFzQyxDQUFDO1FBRTdELE1BQU0sT0FBTyxHQUFHO1lBQ2QsK0JBQStCLEVBQUUsS0FBSyxDQUFDLFlBQVk7WUFDbkQsMkJBQTJCLEVBQUUsUUFBUTtZQUNyQywrQkFBK0IsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLFlBQVk7WUFDM0QsdUJBQXVCLEVBQUUsZ0JBQWdCO1lBQ3pDLHdCQUF3QixFQUFFLE1BQU07WUFDaEMsVUFBVSxFQUFFLGFBQWE7WUFDekIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNsQyxjQUFjLEVBQUUsS0FBSyxDQUFDLHVCQUF1QixDQUFDLGVBQWU7WUFDN0QsT0FBTyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7U0FDdkUsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQztZQUNuQyxZQUFZLEVBQUUsZ0JBQWdCO1lBQzlCLFlBQVksRUFBRSwwQkFBaUIsQ0FBQyxZQUFZO1NBQzdDLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxNQUFNLGlCQUFpQixHQUFHLElBQUksaUNBQWdCLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQ3hFLFNBQVMsRUFBRSxXQUFXO1NBQ3ZCLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksK0JBQXFCLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNqRSxHQUFHLEVBQUUsMEJBQWlCLENBQUMsR0FBRztZQUMxQixjQUFjLEVBQUUsMEJBQWlCLENBQUMsY0FBYztTQUNqRCxDQUFDLENBQUM7UUFFSCxJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUM7UUFDN0IsSUFBSSwwQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN0QyxVQUFVLEdBQUcsSUFBSSwrQkFBcUIsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO2dCQUN6RCxHQUFHLEVBQUUsMEJBQWlCLENBQUMsR0FBRztnQkFDMUIsY0FBYyxFQUFFLDBCQUFpQixDQUFDLGNBQWM7YUFDakQsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQWlCLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQWlCLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQWlCLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXJELHdDQUF3QztRQUN4QyxLQUFLLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUNoQyxJQUFJLGFBQWEsR0FBb0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUksSUFBSSxHQUEwQixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFO2dCQUNwQyxLQUFLLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDakUsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFdBQVcsRUFBRSxPQUFPO2dCQUNwQixVQUFVLEVBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDO2dCQUN0QyxHQUFHLEVBQUUsYUFBYSxDQUFDLEdBQUc7Z0JBQ3RCLGNBQWMsRUFBRSxhQUFhLENBQUMsR0FBRzthQUNsQyxDQUFDLENBQUMsZUFBZSxDQUFDO2dCQUNqQixhQUFhLEVBQUUsYUFBYSxDQUFDLGFBQWE7YUFDM0MsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxJQUFJLG9DQUFnQixDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUMzQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDdEIsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLHVCQUF1QjtZQUN0RCxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7WUFDZCxjQUFjLEVBQUUsV0FBVztZQUMzQixlQUFlLEVBQUUsS0FBSztTQUN2QixDQUFDLENBQUM7UUFFSCxJQUFJLDBCQUFpQixDQUFDLGdCQUFnQixFQUFFO1lBQ3RDLElBQUksb0NBQWdCLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtnQkFDMUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUN0Qix1QkFBdUIsRUFBRSxLQUFLLENBQUMsdUJBQXVCO2dCQUN0RCxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7Z0JBQ2QsY0FBYyxFQUFFLFVBQVU7Z0JBQzFCLGVBQWUsRUFBRSxJQUFJO2FBQ3RCLENBQUMsQ0FBQztTQUNKO1FBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksZ0JBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQzlELEtBQUssRUFBRSxhQUFhO1NBQ3JCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZGRCw0Q0F1RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0Nmbk91dHB1dCwgQ29uc3RydWN0fSBmcm9tIFwiQGF3cy1jZGsvY29yZVwiO1xuaW1wb3J0IHsgSVZwYyB9IGZyb20gXCJAYXdzLWNkay9hd3MtZWMyXCI7XG5cbmltcG9ydCBlY3MgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtZWNzJyk7XG5pbXBvcnQgZWMyID0gcmVxdWlyZShcIkBhd3MtY2RrL2F3cy1lYzJcIik7XG5pbXBvcnQgeyBEb2NrZXJJbWFnZUFzc2V0IH0gZnJvbSAnQGF3cy1jZGsvYXdzLWVjci1hc3NldHMnO1xuaW1wb3J0IHsgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uIH0gZnJvbSAnQGF3cy1jZGsvYXdzLWVjcyc7XG5cbmltcG9ydCB7YWlyZmxvd1Rhc2tDb25maWcsIENvbnRhaW5lckNvbmZpZ30gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgU2VydmljZUNvbnN0cnVjdCB9IGZyb20gXCIuL3NlcnZpY2UtY29uc3RydWN0XCI7XG5cblxuZXhwb3J0IGludGVyZmFjZSBBaXJmbG93Q29uc3RydWN0UHJvcHMge1xuICByZWFkb25seSB2cGM6IElWcGM7XG4gIHJlYWRvbmx5IGNsdXN0ZXI6IGVjcy5JQ2x1c3RlcjtcbiAgcmVhZG9ubHkgZGJDb25uZWN0aW9uOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGRlZmF1bHRWcGNTZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG4gIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBlYzIuSVN1Ym5ldFtdO1xufVxuXG5leHBvcnQgY2xhc3MgQWlyZmxvd0NvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBhZG1pblBhc3N3b3JkT3V0cHV0PzogQ2ZuT3V0cHV0O1xuXG4gIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBBaXJmbG93Q29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihwYXJlbnQsIG5hbWUpO1xuXG4gICAgY29uc3QgYWRtaW5QYXNzd29yZCA9IFwiYmZjYmQzYTMtZDg4YS00MTEzLTlmNTMtMGZlZjk1YmE3NTE1XCI7XG5cbiAgICBjb25zdCBFTlZfVkFSID0ge1xuICAgICAgQUlSRkxPV19fQ09SRV9fU1FMX0FMQ0hFTVlfQ09OTjogcHJvcHMuZGJDb25uZWN0aW9uLFxuICAgICAgQUlSRkxPV19fQ0VMRVJZX19CUk9LRVJfVVJMOiBcInNxczovL1wiLFxuICAgICAgQUlSRkxPV19fQ0VMRVJZX19SRVNVTFRfQkFDS0VORDogXCJkYitcIiArIHByb3BzLmRiQ29ubmVjdGlvbixcbiAgICAgIEFJUkZMT1dfX0NPUkVfX0VYRUNVVE9SOiBcIkNlbGVyeUV4ZWN1dG9yXCIsXG4gICAgICBBSVJGTE9XX19XRUJTRVJWRVJfX1JCQUM6IFwiVHJ1ZVwiLFxuICAgICAgQURNSU5fUEFTUzogYWRtaW5QYXNzd29yZCxcbiAgICAgIENMVVNURVI6IHByb3BzLmNsdXN0ZXIuY2x1c3Rlck5hbWUsXG4gICAgICBTRUNVUklUWV9HUk9VUDogcHJvcHMuZGVmYXVsdFZwY1NlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkLFxuICAgICAgU1VCTkVUUzogcHJvcHMucHJpdmF0ZVN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuc3VibmV0SWQpLmpvaW4oXCIsXCIpXG4gICAgfTtcblxuICAgIGNvbnN0IGxvZ2dpbmcgPSBuZXcgZWNzLkF3c0xvZ0RyaXZlcih7XG4gICAgICBzdHJlYW1QcmVmaXg6ICdGYXJGbG93TG9nZ2luZycsXG4gICAgICBsb2dSZXRlbnRpb246IGFpcmZsb3dUYXNrQ29uZmlnLmxvZ1JldGVudGlvblxuICAgIH0pO1xuXG4gICAgLy8gQnVpbGQgQWlyZmxvdyBkb2NrZXIgaW1hZ2UgZnJvbSBEb2NrZXJmaWxlXG4gICAgY29uc3QgYWlyZmxvd0ltYWdlQXNzZXQgPSBuZXcgRG9ja2VySW1hZ2VBc3NldCh0aGlzLCAnQWlyZmxvd0J1aWxkSW1hZ2UnLCB7XG4gICAgICBkaXJlY3Rvcnk6ICcuL2FpcmZsb3cnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWlyZmxvd1Rhc2sgPSBuZXcgRmFyZ2F0ZVRhc2tEZWZpbml0aW9uKHRoaXMsICdBaXJmbG93VGFzaycsIHtcbiAgICAgIGNwdTogYWlyZmxvd1Rhc2tDb25maWcuY3B1LFxuICAgICAgbWVtb3J5TGltaXRNaUI6IGFpcmZsb3dUYXNrQ29uZmlnLm1lbW9yeUxpbWl0TWlCXG4gICAgfSk7XG5cbiAgICBsZXQgd29ya2VyVGFzayA9IGFpcmZsb3dUYXNrO1xuICAgIGlmIChhaXJmbG93VGFza0NvbmZpZy5jcmVhdGVXb3JrZXJQb29sKSB7XG4gICAgICB3b3JrZXJUYXNrID0gbmV3IEZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCAnV29ya2VyVGFzaycsIHtcbiAgICAgICAgY3B1OiBhaXJmbG93VGFza0NvbmZpZy5jcHUsXG4gICAgICAgIG1lbW9yeUxpbWl0TWlCOiBhaXJmbG93VGFza0NvbmZpZy5tZW1vcnlMaW1pdE1pQlxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV0IG1tYXAgPSBuZXcgTWFwKCk7XG4gICAgbW1hcC5zZXQoYWlyZmxvd1Rhc2tDb25maWcud2Vic2VydmVyQ29uZmlnLCBhaXJmbG93VGFzayk7XG4gICAgbW1hcC5zZXQoYWlyZmxvd1Rhc2tDb25maWcuc2NoZWR1bGVyQ29uZmlnLCBhaXJmbG93VGFzayk7XG4gICAgbW1hcC5zZXQoYWlyZmxvd1Rhc2tDb25maWcud29ya2VyQ29uZmlnLCB3b3JrZXJUYXNrKTtcblxuICAgIC8vIEFkZCBjb250YWluZXJzIHRvIGNvcnJlc3BvbmRpbmcgVGFza3NcbiAgICBmb3IgKGxldCBlbnRyeSBvZiBtbWFwLmVudHJpZXMoKSkge1xuICAgICAgbGV0IGNvbnRhaW5lckluZm86IENvbnRhaW5lckNvbmZpZyA9IGVudHJ5WzBdO1xuICAgICAgbGV0IHRhc2s6IEZhcmdhdGVUYXNrRGVmaW5pdGlvbiA9IGVudHJ5WzFdO1xuXG4gICAgICB0YXNrLmFkZENvbnRhaW5lcihjb250YWluZXJJbmZvLm5hbWUsIHtcbiAgICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tRG9ja2VySW1hZ2VBc3NldChhaXJmbG93SW1hZ2VBc3NldCksXG4gICAgICAgIGxvZ2dpbmc6IGxvZ2dpbmcsXG4gICAgICAgIGVudmlyb25tZW50OiBFTlZfVkFSLFxuICAgICAgICBlbnRyeVBvaW50OiBbY29udGFpbmVySW5mby5lbnRyeVBvaW50XSxcbiAgICAgICAgY3B1OiBjb250YWluZXJJbmZvLmNwdSxcbiAgICAgICAgbWVtb3J5TGltaXRNaUI6IGNvbnRhaW5lckluZm8uY3B1XG4gICAgICB9KS5hZGRQb3J0TWFwcGluZ3Moe1xuICAgICAgICBjb250YWluZXJQb3J0OiBjb250YWluZXJJbmZvLmNvbnRhaW5lclBvcnRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIG5ldyBTZXJ2aWNlQ29uc3RydWN0KHRoaXMsIFwiQWlyZmxvd1NlcnZpY2VcIiwge1xuICAgICAgY2x1c3RlcjogcHJvcHMuY2x1c3RlcixcbiAgICAgIGRlZmF1bHRWcGNTZWN1cml0eUdyb3VwOiBwcm9wcy5kZWZhdWx0VnBjU2VjdXJpdHlHcm91cCxcbiAgICAgIHZwYzogcHJvcHMudnBjLFxuICAgICAgdGFza0RlZmluaXRpb246IGFpcmZsb3dUYXNrLFxuICAgICAgaXNXb3JrZXJTZXJ2aWNlOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgaWYgKGFpcmZsb3dUYXNrQ29uZmlnLmNyZWF0ZVdvcmtlclBvb2wpIHtcbiAgICAgIG5ldyBTZXJ2aWNlQ29uc3RydWN0KHRoaXMsIFwiV29ya2VyU2VydmljZVwiLCB7XG4gICAgICAgIGNsdXN0ZXI6IHByb3BzLmNsdXN0ZXIsXG4gICAgICAgIGRlZmF1bHRWcGNTZWN1cml0eUdyb3VwOiBwcm9wcy5kZWZhdWx0VnBjU2VjdXJpdHlHcm91cCxcbiAgICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICAgIHRhc2tEZWZpbml0aW9uOiB3b3JrZXJUYXNrLFxuICAgICAgICBpc1dvcmtlclNlcnZpY2U6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuYWRtaW5QYXNzd29yZE91dHB1dCA9IG5ldyBDZm5PdXRwdXQodGhpcywgJ0FkbWluUGFzc3dvcmQnLCB7XG4gICAgICB2YWx1ZTogYWRtaW5QYXNzd29yZFxuICAgIH0pO1xuICB9XG59XG4iXX0=