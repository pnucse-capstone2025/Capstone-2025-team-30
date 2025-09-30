import { DashboardContainer as Layout } from "@/shared/components/styles";
import Page from "./components/layout/Page";
import ResultHeader from "./components/layout/ResultHeader";
import ResultBody from "./components/layout/ResultBody";

const Results = () => {
    return (
        <Page>
            <Layout>
                <ResultHeader />
                <ResultBody />
            </Layout>
        </Page>
    );
};

export default Results;