import React, { FC } from "react";

import { parseISO, format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";

import { Head } from "../../../../../../components/Head";
import { DeleteIcon, FileIcon } from "../../../../../../components/Icon";
import { MainHeading } from "../../../../../../components/MainHeading";
import { Menu } from "../../../../../../components/Menu";
import { NavHeader } from "../../../../../../components/NavHeader";
import { Navigation } from "../../../../../../components/Navigation";
import { PageLayout } from "../../../../../../components/PageLayout";
import { MobileFileList, Table } from "../../../../../../components/Table";
import {
  File,
  useGetWorkspaceByIdQuery,
  useGetFileByIdQuery,
  useDeleteFileMutation,
} from "../../../../../../lib/generated/graphql";
import withUrqlClient from "../../../../../../lib/withUrqlClient";

const PageContent = styled.section`
  flex-grow: 3;
  min-height: 100vh;
  padding-top: 24px;
  padding-left: 16px;
  padding-right: 16px;
  ${({ theme }) => `
    background-color: ${theme.colorNhsukWhite};
    @media (min-width: ${theme.mqBreakpoints.tablet}) {
      padding-left: 20px;
      padding-right: 20px;
    }
    @media (min-width: ${theme.mqBreakpoints.largeDesktop}) {
      padding-left: 32px;
      padding-right: 32px;
    }
  `}
`;

const ContentWrapper = styled.div`
  display: flex;
`;

const Description = styled.p`
  padding-bottom: 40px;
`;

const DownloadFile = styled.a`
  display: inline-block;
  padding-right: 8px;
  font-size: 16px;
`;

const iconCell: FC<File> = ({ fileType }) => <FileIcon fileType={fileType} />;

const titleCell: FC<File> = ({ title }) => <>{title}</>;

const ModifiedDate = styled.span`
  color: ${({ theme }) => theme.colorNhsukGrey1};
`;

const modifiedAtCell: FC<File> = ({ modifiedAt }) => (
  <ModifiedDate>{format(parseISO(modifiedAt), "LLL d, yyyy")}</ModifiedDate>
);

const FileHomepage = () => {
  const router = useRouter();
  const { fileId, workspaceId, folderId } = router.query;

  if (fileId === undefined || Array.isArray(fileId)) {
    throw new Error("fileId required in URL");
  }

  if (folderId === undefined || Array.isArray(folderId)) {
    throw new Error("folderId required in URL");
  }

  if (workspaceId === undefined || Array.isArray(workspaceId)) {
    throw new Error("workspaceId required in URL");
  }

  const [workspace] = useGetWorkspaceByIdQuery({
    variables: { id: workspaceId },
  });

  const [file] = useGetFileByIdQuery({
    variables: { id: fileId },
  });

  const [, deleteFile] = useDeleteFileMutation();

  const onClick = async () => {
    const message = "Are you sure you want to delete this file?";
    const result = window.confirm(message);
    if (result) {
      await deleteFile({ id: fileId });
      await router.push(`/workspaces/${workspaceId}/folders/${folderId}`);
    }
  };

  const actionsCell: FC<File> = ({ id }) => (
    <Link href={`/workspaces/${workspaceId}/download/${id}`} passHref>
      <DownloadFile>Download file</DownloadFile>
    </Link>
  );

  return (
    <>
      <Head title={`File - ${file.data?.file.title || "Loading..."}`} />
      <PageLayout>
        <NavHeader />
        <ContentWrapper>
          <Navigation
            workspaceId={workspaceId}
            workspaceTitle={workspace.data?.workspace.title || "unknown"}
            activeFolder={folderId}
          />
          <PageContent>
            <MainHeading
              menu={
                <Menu
                  background="light"
                  dataCy="file-options"
                  items={[
                    {
                      title: "Delete file",
                      icon: <DeleteIcon />,
                      handler: onClick,
                      dataCy: "delete-file",
                    },
                  ]}
                />
              }
            >
              {file.data?.file.title || "Loading..."}
            </MainHeading>
            <Description>
              {file.data?.file.description || "Loading..."}
            </Description>
            {file.error && <p> Oh no... {file.error?.message} </p>}
            {file.fetching || !file.data ? (
              "Loading..."
            ) : (
              <>
                <MobileFileList
                  files={[file.data.file]}
                  workspaceId={workspaceId}
                  titleLink={false}
                />
                <Table
                  columns={[
                    { name: "Title", content: iconCell },
                    { content: titleCell },
                    { name: "Last modified", content: modifiedAtCell },
                    { name: "Actions", content: actionsCell },
                  ]}
                  data={[file.data.file as File]}
                />
              </>
            )}
          </PageContent>
        </ContentWrapper>
      </PageLayout>
    </>
  );
};

export default withUrqlClient(FileHomepage);
